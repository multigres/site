#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');

// Source and target directories
const DOCS_SOURCE = path.join(ROOT, 'docs');
const DOCS_TARGET = path.join(__dirname, '../content/docs');
const BLOG_SOURCE = path.join(ROOT, 'blog');
const BLOG_TARGET = path.join(__dirname, '../content/blog');
const AUTHORS_FILE = path.join(BLOG_SOURCE, 'authors.yml');
const STATIC_SOURCE = path.join(ROOT, 'static/img');
const STATIC_TARGET = path.join(__dirname, '../public/img');
const ANIMATIONS_SOURCE = path.join(ROOT, 'src/components');
const ANIMATIONS_TARGET = path.join(__dirname, '../lib/animations');

// Load authors
function loadAuthors() {
  try {
    const content = fs.readFileSync(AUTHORS_FILE, 'utf-8');
    return yaml.load(content);
  } catch (err) {
    console.warn('Warning: Could not load authors.yml:', err.message);
    return {};
  }
}

// Parse frontmatter from content
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: content };
  }
  try {
    const frontmatter = yaml.load(match[1]);
    return { frontmatter, body: match[2] };
  } catch (err) {
    console.warn('Warning: Could not parse frontmatter:', err.message);
    return { frontmatter: {}, body: content };
  }
}

// Extract title from first # heading
function extractTitle(body) {
  const match = body.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

// Strip the first H1 heading from the body (since title is in frontmatter)
function stripH1Title(body) {
  return body.replace(/^#\s+.+\n*/m, '');
}

// Extract description from first paragraph after frontmatter
function extractDescription(body, maxLength = 160) {
  // Remove the title heading
  const withoutTitle = body.replace(/^#\s+.+$/m, '').trim();

  // Find first paragraph (non-empty line that's not a heading, admonition, or HTML)
  const lines = withoutTitle.split('\n');
  let description = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('#')) continue;
    if (trimmed.startsWith(':::')) continue;
    if (trimmed.startsWith('<')) continue;
    if (trimmed.startsWith('<!--')) continue;
    if (trimmed.startsWith('{/*')) continue;
    if (trimmed.startsWith('![')) continue;
    if (trimmed.startsWith('*') && trimmed.endsWith('*')) continue; // Emphasis-only lines

    description = trimmed;
    break;
  }

  // Truncate and clean
  if (description.length > maxLength) {
    description = description.substring(0, maxLength - 3) + '...';
  }

  return description || 'A blog post from Multigres.';
}

// Convert HTML comments to MDX comments
function convertHtmlComments(content) {
  // Convert <!-- comment --> to {/* comment */}
  return content.replace(/<!--([\s\S]*?)-->/g, (match, comment) => {
    const trimmed = comment.trim();
    // Special handling for truncate marker
    if (trimmed === 'truncate') {
      return '{/* truncate */}';
    }
    // Special handling for prettier-ignore
    if (trimmed.includes('prettier-ignore')) {
      return `{/* ${trimmed} */}`;
    }
    return `{/* ${trimmed} */}`;
  });
}

// Convert Docusaurus-specific imports
function convertDocusaurusImports(content) {
  return content
    .split('\n')
    .map(line => {
      const trimmed = line.trim();
      // Remove @docusaurus/* imports entirely
      if (trimmed.startsWith('import ') && trimmed.includes('@docusaurus/')) {
        return null;
      }
      // Convert @site/src/components/AnimatedSVG to @/components/AnimatedSVG
      if (trimmed.startsWith('import ') && trimmed.includes('@site/src/components/AnimatedSVG')) {
        return line.replace('@site/src/components/AnimatedSVG', '@/components/AnimatedSVG');
      }
      // Convert other @site/src/components/* to @/lib/animations/*
      if (trimmed.startsWith('import ') && trimmed.includes('@site/src/components/')) {
        return line.replace('@site/src/components/', '@/lib/animations/');
      }
      // Remove other @site/* imports
      if (trimmed.startsWith('import ') && trimmed.includes('@site/')) {
        return null;
      }
      return line;
    })
    .filter(line => line !== null)
    .join('\n');
}

// Convert useBaseUrl('/path') to just '/path'
function convertUseBaseUrl(content) {
  // Match useBaseUrl('/path') or useBaseUrl("/path") and replace with just the path
  return content.replace(/useBaseUrl\(['"]([^'"]+)['"]\)/g, '"$1"');
}

// Convert onAnimate={functionName} to onAnimate="functionName"
// This is needed because Next.js App Router can't pass functions from server to client
function convertOnAnimateProps(content) {
  // Match onAnimate={variableName} and convert to onAnimate="variableName"
  return content.replace(/onAnimate=\{(\w+)\}/g, 'onAnimate="$1"');
}

// Fix internal links
function fixInternalLinks(content) {
  // /blog/slug links stay the same for Fumadocs
  // /docs/slug links stay the same
  // /consensus/... links need to be updated if consensus is merged into docs
  return content;
}

// Sync docs from /docs to /apps/docs/content/docs
function syncDocs() {
  console.log('Syncing docs...');

  if (!fs.existsSync(DOCS_SOURCE)) {
    console.log('  No docs source directory found, skipping');
    return;
  }

  // Ensure target exists
  fs.mkdirSync(DOCS_TARGET, { recursive: true });

  const files = fs.readdirSync(DOCS_SOURCE).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));

  for (const file of files) {
    const sourcePath = path.join(DOCS_SOURCE, file);
    const content = fs.readFileSync(sourcePath, 'utf-8');
    const { frontmatter, body } = parseFrontmatter(content);

    // Build new frontmatter
    const newFrontmatter = {
      title: frontmatter.title || extractTitle(body) || path.basename(file, path.extname(file)),
      description: frontmatter.description || extractDescription(body),
    };

    // Convert content
    let newBody = convertHtmlComments(body);
    newBody = convertDocusaurusImports(newBody);
    newBody = convertUseBaseUrl(newBody);
    newBody = convertOnAnimateProps(newBody);
    newBody = fixInternalLinks(newBody);
    newBody = stripH1Title(newBody);

    // Build new content
    const newContent = `---\n${yaml.dump(newFrontmatter)}---\n${newBody}`;

    // Write to target (always as .mdx)
    const targetFile = file.replace(/\.md$/, '.mdx');
    const targetPath = path.join(DOCS_TARGET, targetFile);
    fs.writeFileSync(targetPath, newContent);
    console.log(`  Synced: ${file} -> ${targetFile}`);
  }
}

// Sync blog from /blog to /apps/docs/content/blog
function syncBlog() {
  console.log('Syncing blog...');

  if (!fs.existsSync(BLOG_SOURCE)) {
    console.log('  No blog source directory found, skipping');
    return;
  }

  const authors = loadAuthors();

  // Ensure target exists
  fs.mkdirSync(BLOG_TARGET, { recursive: true });

  const files = fs.readdirSync(BLOG_SOURCE).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));

  for (const file of files) {
    // Skip authors.yml and other non-post files
    if (!file.match(/^\d{4}-\d{2}-\d{2}/)) {
      continue;
    }

    const sourcePath = path.join(BLOG_SOURCE, file);
    const content = fs.readFileSync(sourcePath, 'utf-8');
    const { frontmatter, body } = parseFrontmatter(content);

    // Resolve author name
    let authorName = 'Unknown Author';
    if (frontmatter.authors && frontmatter.authors.length > 0) {
      const authorKey = frontmatter.authors[0];
      if (authors[authorKey]) {
        authorName = authors[authorKey].name;
      } else {
        authorName = authorKey;
      }
    }

    // Extract title
    const title = frontmatter.title || extractTitle(body) || frontmatter.slug || 'Untitled';

    // Build new frontmatter for Fumadocs blog
    const newFrontmatter = {
      title: title,
      description: extractDescription(body),
      date: frontmatter.date,
      author: authorName,
    };

    // Convert content
    let newBody = convertHtmlComments(body);
    newBody = convertDocusaurusImports(newBody);
    newBody = convertUseBaseUrl(newBody);
    newBody = convertOnAnimateProps(newBody);
    newBody = fixInternalLinks(newBody);
    newBody = stripH1Title(newBody);

    // Build new content
    const newContent = `---\n${yaml.dump(newFrontmatter)}---\n${newBody}`;

    // Write to target (always as .mdx)
    const targetFile = file.replace(/\.md$/, '.mdx');
    const targetPath = path.join(BLOG_TARGET, targetFile);
    fs.writeFileSync(targetPath, newContent);
    console.log(`  Synced: ${file} -> ${targetFile}`);
  }
}

// Copy directory recursively
function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Sync static assets from /static/img to /apps/docs/public/img
function syncStatic() {
  console.log('Syncing static assets...');

  if (!fs.existsSync(STATIC_SOURCE)) {
    console.log('  No static source directory found, skipping');
    return;
  }

  copyDirRecursive(STATIC_SOURCE, STATIC_TARGET);
  console.log(`  Copied: ${STATIC_SOURCE} -> ${STATIC_TARGET}`);
}

// Sync animation files from /src/components to /apps/docs/lib/animations
function syncAnimations() {
  console.log('Syncing animations...');

  if (!fs.existsSync(ANIMATIONS_SOURCE)) {
    console.log('  No animations source directory found, skipping');
    return;
  }

  // Ensure target exists
  fs.mkdirSync(ANIMATIONS_TARGET, { recursive: true });

  // Only sync .ts files that are animation configs (not React components)
  const files = fs.readdirSync(ANIMATIONS_SOURCE).filter(f =>
    f.endsWith('.ts') && !f.endsWith('.tsx')
  );

  for (const file of files) {
    const sourcePath = path.join(ANIMATIONS_SOURCE, file);
    let content = fs.readFileSync(sourcePath, 'utf-8');

    // Fix import paths: @site/src/lib/svg-animator -> ../svg-animator
    content = content.replace(/@site\/src\/lib\/svg-animator/g, '../svg-animator');
    // Also fix relative paths that might be wrong
    content = content.replace(/["']\.\.\/lib\/svg-animator["']/g, '"../svg-animator"');

    const targetPath = path.join(ANIMATIONS_TARGET, file);
    fs.writeFileSync(targetPath, content);
    console.log(`  Synced: ${file}`);
  }
}

// Main
function main() {
  console.log('Starting content sync...\n');
  syncDocs();
  console.log('');
  syncBlog();
  console.log('');
  syncStatic();
  console.log('');
  syncAnimations();
  console.log('\nSync complete!');
}

main();
