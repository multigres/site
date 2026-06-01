#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dayjs from 'dayjs';
import { Feed } from 'feed';
import yaml from 'js-yaml';
import { authors, parseAuthorKeys, type Author } from '../src/lib/authors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const BLOG_DIR = path.join(ROOT_DIR, 'content/blog');
const BUILD_DIR = path.join(ROOT_DIR, '.vercel/output/static/blog');
const SITE_URL = 'https://multigres.com';

type Frontmatter = {
  title?: string;
  description?: string;
  date?: string | Date;
  author?: string;
  authors?: string[];
  tags?: string[];
};

type BlogPost = {
  slug: string;
  title: string;
  authors: string[];
  date: Date;
  summary: string;
  tags: string[];
};

function parseFrontmatter(content: string): { data: Frontmatter; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return { data: {}, body: content };

  const data = (yaml.load(match[1]) ?? {}) as Frontmatter;
  return {
    data,
    body: content.slice(match[0].length),
  };
}

function extractHeadingTitle(content: string): string | undefined {
  return content.match(/^#+\s+(.+)$/m)?.[1]?.trim();
}

function extractSummary(content: string): string {
  const summary = content
    .replace(/^#+\s+.*$/gm, '')
    .replace(/^!\[.*?\]\(.*?\)\n?/gm, '')
    .split('\n')
    .filter((line) => line.trim())
    .slice(0, 3)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return summary.slice(0, 300) || 'No summary available';
}

function getSlug(fileName: string): string {
  return fileName.replace(/\.(md|mdx)$/, '');
}

function getBlogPosts(): BlogPost[] {
  return fs
    .readdirSync(BLOG_DIR)
    .filter((fileName) => /\.(md|mdx)$/.test(fileName))
    .map((fileName) => {
      const content = fs.readFileSync(path.join(BLOG_DIR, fileName), 'utf8');
      const { data, body } = parseFrontmatter(content);
      const date = data.date ? new Date(data.date) : new Date(0);

      return {
        slug: getSlug(fileName),
        title: data.title ?? extractHeadingTitle(body) ?? getSlug(fileName),
        authors: parseAuthorKeys(data.authors ?? data.author),
        date,
        summary: data.description ?? extractSummary(body),
        tags: data.tags ?? [],
      };
    })
    .filter((post) => !Number.isNaN(post.date.getTime()))
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

function createFeed(title: string, description: string, feedPath: string) {
  return new Feed({
    title,
    description,
    id: `${SITE_URL}${feedPath}`,
    link: `${SITE_URL}/blog`,
    language: 'en',
    feedLinks: {
      rss2: `${SITE_URL}${feedPath}`,
    },
  });
}

function addPosts(feed: Feed, posts: BlogPost[], author?: Author) {
  for (const post of posts) {
    feed.addItem({
      title: post.title,
      id: `${SITE_URL}/blog/${post.slug}`,
      link: `${SITE_URL}/blog/${post.slug}`,
      description: post.summary,
      date: post.date,
      author: author
        ? [
            {
              name: author.name,
              link: author.url,
            },
          ]
        : undefined,
    });
  }
}

function formatRss(feed: Feed): string {
  let rssContent = feed.rss2();

  rssContent = rssContent.replace(
    /<title><!\[CDATA\[(.*?)\]\]><\/title>/g,
    '<title>$1</title>',
  );
  rssContent = rssContent.replace(
    /<description><!\[CDATA\[(.*?)\]\]><\/description>/gs,
    '<description>$1</description>',
  );
  rssContent = rssContent.replace(/<pubDate>(.*?)<\/pubDate>/g, (_match, dateStr) => {
    const formattedDate = dayjs(dateStr)
      .startOf('day')
      .format('ddd, DD MMM YYYY HH:mm:ss [-0700]');
    return `<pubDate>${formattedDate}</pubDate>`;
  });
  rssContent = rssContent.replace(/<lastBuildDate>(.*?)<\/lastBuildDate>/g, (_match, dateStr) => {
    const formattedDate = dayjs(dateStr)
      .startOf('day')
      .format('ddd, DD MMM YYYY HH:mm:ss [-0700]');
    return `<lastBuildDate>${formattedDate}</lastBuildDate>`;
  });
  rssContent = rssContent.replace(/<docs>.*?<\/docs>\n\s*/g, '');
  rssContent = rssContent.replace(/<generator>.*?<\/generator>\n\s*/g, '');
  rssContent = rssContent.replace(
    /<item>\s+<title>(.*?)<\/title>\s+<link>(.*?)<\/link>\s+<guid>(.*?)<\/guid>\s+<pubDate>(.*?)<\/pubDate>\s+<description>(.*?)<\/description>\s+<\/item>/gs,
    (_match, title, link, guid, pubDate, description) => `<item>
            <guid>${guid}</guid>
            <title>${title}</title>
            <link>${link}</link>
            <description>${description}</description>
            <pubDate>${pubDate}</pubDate>
        </item>`,
  );

  return rssContent;
}

function writeFeed(fileName: string, feed: Feed) {
  fs.mkdirSync(BUILD_DIR, { recursive: true });
  fs.writeFileSync(path.join(BUILD_DIR, fileName), formatRss(feed));
}

function main() {
  const posts = getBlogPosts();
  if (posts.length === 0) {
    console.warn('No blog posts found');
    return;
  }

  const mainFeed = createFeed('Multigres Blog', 'Latest posts from the Multigres team', '/blog/rss.xml');
  addPosts(mainFeed, posts);
  writeFeed('rss.xml', mainFeed);
  console.log(`Created rss.xml (${posts.length} posts)`);

  for (const [authorKey, authorData] of Object.entries(authors)) {
    const authorPosts = posts.filter(
      (post) => post.authors.includes(authorKey) && post.tags.includes('planetpg'),
    );
    const feed = createFeed(
      `Multigres Blog - ${authorData.name}`,
      `Latest posts from ${authorData.name}`,
      `/blog/planetpg-${authorKey}-rss.xml`,
    );
    addPosts(feed, authorPosts, authorData);
    writeFeed(`planetpg-${authorKey}-rss.xml`, feed);
    console.log(`Created planetpg-${authorKey}-rss.xml (${authorPosts.length} posts)`);
  }
}

main();
