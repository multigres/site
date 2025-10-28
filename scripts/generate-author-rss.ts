#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { Feed } from "feed";
import yaml from "js-yaml";
import { fileURLToPath } from "url";
import dayjs from "dayjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const BLOG_DIR = path.join(__dirname, "../blog");
const BUILD_DIR = path.join(__dirname, "../build/blog");
const SITE_URL = "https://multigres.com";

interface Frontmatter {
  slug: string;
  title?: string;
  authors?: string[];
  date: string;
  tags?: string[];
}

interface Author {
  name: string;
  title: string;
  url: string;
  image_url: string;
}

interface BlogPost {
  slug: string;
  title: string;
  authors: string[];
  date: Date;
  summary: string;
  tags: string[];
}

// Parse YAML frontmatter from markdown files
function parseFrontmatter(content: string): Frontmatter | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  try {
    return yaml.load(match[1]) as Frontmatter;
  } catch (e) {
    console.error("Error parsing frontmatter:", e);
    return null;
  }
}

// Extract title from first markdown heading
function extractHeadingTitle(content: string): string | null {
  const headingMatch = content.match(/^#+\s+(.+)$/m);
  return headingMatch ? headingMatch[1].trim() : null;
}

// Extract summary from markdown (text before <!--truncate--> or first 200 chars)
function extractSummary(content: string): string {
  const parts = content.split("<!--truncate-->");
  let summary = parts[0].replace(/^---\n[\s\S]*?\n---\n/, ""); // Remove frontmatter

  // Remove markdown headers and get first paragraph
  summary = summary
    .replace(/^#+\s+.*$/gm, "") // Remove headers
    .replace(/^!\[.*?\]\(.*?\)\n?/gm, "") // Remove images
    .split("\n")
    .filter((line) => line.trim())
    .slice(0, 3)
    .join(" ")
    .substring(0, 300)
    .trim();

  return summary || "No summary available";
}

// Read authors configuration
function loadAuthors(): Record<string, Author> {
  try {
    const authorsContent = fs.readFileSync(
      path.join(BLOG_DIR, "authors.yml"),
      "utf8",
    );
    return (yaml.load(authorsContent) as Record<string, Author>) || {};
  } catch (e) {
    console.error("Error loading authors.yml:", e);
    return {};
  }
}

// Get all blog posts
function getBlogPosts(): BlogPost[] {
  const files = fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.match(/\.(md|mdx)$/))
    .sort()
    .reverse();

  const posts: BlogPost[] = [];

  for (const file of files) {
    const filePath = path.join(BLOG_DIR, file);
    const content = fs.readFileSync(filePath, "utf8");
    const frontmatter = parseFrontmatter(content);

    if (!frontmatter) continue;

    // Use frontmatter title, fall back to first heading, then slug
    const title =
      frontmatter.title || extractHeadingTitle(content) || frontmatter.slug;

    posts.push({
      slug: frontmatter.slug,
      title,
      authors: frontmatter.authors || [],
      date: new Date(frontmatter.date),
      summary: extractSummary(content),
      tags: frontmatter.tags || [],
    });
  }

  return posts;
}

// Generate RSS feed for a specific author
function generateAuthorFeed(
  author: string,
  authorData: Author,
  posts: BlogPost[],
): Feed {
  const feed = new Feed({
    title: `Multigres Blog - ${authorData.name}`,
    description: `Latest posts from ${authorData.name}`,
    id: `${SITE_URL}/blog/authors/${author}/`,
    link: `${SITE_URL}/blog`,
    language: "en",
    image: authorData.image_url,
    favicon: `${SITE_URL}/favicon.ico`,
    generator: "generate-author-rss.ts",
  });

  // Filter posts by author and planetpg tag
  const authorPosts = posts.filter(
    (post) => post.authors.includes(author) && post.tags.includes("planetpg"),
  );

  for (const post of authorPosts) {
    feed.addItem({
      title: post.title,
      id: `${SITE_URL}/blog/${post.slug}`,
      link: `${SITE_URL}/blog/${post.slug}`,
      description: post.summary,
      date: post.date,
      author: [
        {
          name: authorData.name,
          link: authorData.url,
        },
      ],
    });
  }

  return feed;
}

// Main function
function main(): void {
  console.log("Generating per-author RSS feeds...");

  const authors = loadAuthors();
  const posts = getBlogPosts();

  if (Object.keys(authors).length === 0) {
    console.warn("No authors found in authors.yml");
    return;
  }

  if (posts.length === 0) {
    console.warn("No blog posts found");
    return;
  }

  // Ensure build directory exists
  if (!fs.existsSync(BUILD_DIR)) {
    fs.mkdirSync(BUILD_DIR, { recursive: true });
  }

  // Generate RSS feed for each author
  for (const [authorKey, authorData] of Object.entries(authors)) {
    const feed = generateAuthorFeed(authorKey, authorData, posts);
    const filename = `planetpg-${authorKey}-rss.xml`;
    const filePath = path.join(BUILD_DIR, filename);

    let rssContent = feed.rss2();
    // Remove CDATA tags from title and description elements
    rssContent = rssContent.replace(
      /<title><!\[CDATA\[(.*?)\]\]><\/title>/g,
      "<title>$1</title>",
    );
    rssContent = rssContent.replace(
      /<description><!\[CDATA\[(.*?)\]\]><\/description>/gs,
      "<description>$1</description>",
    );

    // Replace date format with custom format
    rssContent = rssContent.replace(
      /<pubDate>(.*?)<\/pubDate>/g,
      (match, dateStr) => {
        const date = dayjs(dateStr);
        const formattedDate = date
          .startOf("day")
          .format("ddd, DD MMM YYYY HH:mm:ss [-0700]");
        return `<pubDate>${formattedDate}</pubDate>`;
      },
    );

    // Replace lastBuildDate format with custom format
    rssContent = rssContent.replace(
      /<lastBuildDate>(.*?)<\/lastBuildDate>/g,
      (match, dateStr) => {
        const date = dayjs(dateStr);
        const formattedDate = date
          .startOf("day")
          .format("ddd, DD MMM YYYY HH:mm:ss [-0700]");
        return `<lastBuildDate>${formattedDate}</lastBuildDate>`;
      },
    );

    fs.writeFileSync(filePath, rssContent);
    console.log(`✓ Created ${filename} (${feed.items.length} posts)`);
  }

  console.log("✓ All author RSS feeds generated successfully");
}

main();
