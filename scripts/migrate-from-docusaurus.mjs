#!/usr/bin/env node
/**
 * One-time migration: multigres-site (Docusaurus) → multigres-web (Fumadocs).
 * Copies docs, consensus, and blog content; normalizes frontmatter and strips Docusaurus-only MDX.
 */
import fs from 'node:fs';
import path from 'node:path';

const SITE_ROOT = path.resolve(import.meta.dirname, '../../multigres-site');
const WEB_ROOT = path.resolve(import.meta.dirname, '..');
const DOCS_OUT = path.join(WEB_ROOT, 'content/docs');
const BLOG_OUT = path.join(WEB_ROOT, 'content/blog');

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content.endsWith('\n') ? content : `${content}\n`);
}

function parseFrontmatter(raw) {
  if (!raw.startsWith('---\n')) return { data: {}, body: raw };
  const end = raw.indexOf('\n---\n', 4);
  if (end === -1) return { data: {}, body: raw };
  const yaml = raw.slice(4, end);
  const body = raw.slice(end + 5);
  const data = {};
  for (const line of yaml.split('\n')) {
    const m = line.match(/^([\w-]+):\s*(.*)$/);
    if (!m) continue;
    const [, key, value] = m;
    if (value.startsWith('[') && value.endsWith(']')) {
      data[key] = value
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean);
    } else {
      data[key] = value.replace(/^['"]|['"]$/g, '');
    }
  }
  return { data, body };
}

function stringifyFrontmatter(data) {
  const lines = ['---'];
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.join(', ')}]`);
    } else {
      lines.push(`${key}: ${JSON.stringify(String(value))}`);
    }
  }
  lines.push('---', '');
  return lines.join('\n');
}

function extractTitle(body) {
  const m = body.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : undefined;
}

function extractDescription(body, title) {
  const withoutHeading = body.replace(/^#\s+.+$/m, '').trim();
  const afterTruncate = withoutHeading.split('<!--truncate-->')[1]?.trim() ?? withoutHeading;
  const paragraph = afterTruncate
    .split(/\n\n+/)
    .map((p) => p.trim())
    .find((p) => p && !p.startsWith('#') && !p.startsWith('import ') && !p.startsWith('<'));
  if (!paragraph) return title ?? '';
  return paragraph.replace(/\n/g, ' ').slice(0, 280);
}

function stripDocusaurusMdx(body) {
  let out = body;

  out = out.replace(/<!--truncate-->\n?/g, '');
  out = out.replace(/<!-- prettier-ignore-start -->\n?/g, '');
  out = out.replace(/<!-- prettier-ignore-end -->\n?/g, '');
  out = out.replace(/\{\/\*[\s\S]*?yt2doc[\s\S]*?\*\/\}\n?/g, '');
  out = out.replace(
    /<iframe[\s\S]*?embed\/([^"?\s]+)[\s\S]*?<\/iframe>/g,
    (_, id) => `\n<YouTubeEmbed id="${id}" />\n`,
  );
  out = out.replace(/^import\s+.+$/gm, '');
  out = out.replace(
    /<ThemedImage[\s\S]*?sources=\{\{[\s\S]*?dark:\s*['"]([^'"]+)['"][\s\S]*?\}\}[\s\S]*?\/>/g,
    (_, src) => `\n![diagram](${src})\n`,
  );
  out = out.replace(
    /<AnimatedSVG[\s\S]*?src=\{useBaseUrl\(['"]([^'"]+)['"]\)\}[\s\S]*?alt="([^"]*)"[\s\S]*?\/>/g,
    (_, src, alt) => `\n![${alt}](${src})\n`,
  );
  out = out.replace(
    /<AnimatedSVG[\s\S]*?src=\{useBaseUrl\(['"]([^'"]+)['"]\)\}[\s\S]*?\/>/g,
    (_, src) => `\n![](${src})\n`,
  );
  out = out.replace(/useBaseUrl\(['"]([^'"]+)['"]\)/g, '$1');

  // Credits page contributor cards → plain list (drop Docusaurus theme styles)
  if (out.includes('deepthi.png')) {
    out = `# Credits

**Sugu Sougoumarane** — Creator of Multigres, Vitess

Many people from the community have reviewed this series and provided valuable feedback. Heartfelt thanks to members of the multigres maintainer team:

- [Deepthi Sigireddi](https://github.com/deepthi) (@deepthi)
- [Rafael Chacon](https://github.com/rafael) (@rafael)
- [Manan Jain](https://github.com/manan-jain) (@manan-jain)
- [Joe McGrath](https://github.com/joemcgrath21) (@joemcgrath21)
- [Florent Poinsard](https://github.com/flpgnrd) (@flpgnrd)
`;
  }

  out = out.replace(/\n{3,}/g, '\n\n');
  return out.trimStart();
}

function removeDuplicateTitle(body, title) {
  if (!title) return body;
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return body.replace(new RegExp(`^#\\s+${escaped}\\s*\\n+`, 'm'), '');
}

function transformDoc(filePath, relPath) {
  const raw = readFile(filePath);
  const { data, body: rawBody } = parseFrontmatter(raw);
  let body = stripDocusaurusMdx(rawBody);
  const title = data.title || extractTitle(body) || path.basename(relPath, path.extname(relPath));
  const description = data.description || extractDescription(body, title);
  body = removeDuplicateTitle(body, title);

  const fm = {
    title,
    ...(description ? { description } : {}),
  };

  const ext = relPath.endsWith('.mdx') ? '.mdx' : '.md';
  const outName = relPath.replace(/\.mdx?$/, ext);
  writeFile(path.join(DOCS_OUT, outName), stringifyFrontmatter(fm) + body);
}

function transformBlog(filePath) {
  const raw = readFile(filePath);
  const { data, body: rawBody } = parseFrontmatter(raw);
  const slug = (data.slug || path.basename(filePath).replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.mdx?$/, '')).replace(/\//g, '-');
  let body = stripDocusaurusMdx(rawBody);
  const title = data.title || extractTitle(body) || slug;
  const description = data.description || extractDescription(body, title);
  body = removeDuplicateTitle(body, title);

  const date = (data.date || '').split('T')[0];
  const authors = Array.isArray(data.authors) ? data.authors : data.authors ? [data.authors] : [];
  const fm = {
    title,
    ...(description ? { description } : {}),
    ...(date ? { date } : {}),
    ...(authors.length ? { authors } : {}),
    ...(data.image ? { image: data.image } : {}),
    ...(data.tags?.length ? { tags: data.tags } : {}),
  };

  const hasMdx = /<[A-Z][A-Za-z]*[\s/>]|<iframe[\s\S]*?<\/iframe>/.test(body);
  const ext = filePath.endsWith('.mdx') || hasMdx ? '.mdx' : '.md';
  writeFile(path.join(BLOG_OUT, `${slug}${ext}`), stringifyFrontmatter(fm) + body);
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function main() {
  if (!fs.existsSync(SITE_ROOT)) {
    console.error(`Source site not found: ${SITE_ROOT}`);
    process.exit(1);
  }

  fs.rmSync(DOCS_OUT, { recursive: true, force: true });
  fs.rmSync(BLOG_OUT, { recursive: true, force: true });
  fs.mkdirSync(DOCS_OUT, { recursive: true });
  fs.mkdirSync(BLOG_OUT, { recursive: true });

  for (const name of fs.readdirSync(path.join(SITE_ROOT, 'docs'))) {
    const src = path.join(SITE_ROOT, 'docs', name);
    if (fs.statSync(src).isFile()) transformDoc(src, name);
  }

  const consensusDir = path.join(SITE_ROOT, 'consensus');
  for (const name of fs.readdirSync(consensusDir)) {
    const src = path.join(consensusDir, name);
    if (!fs.statSync(src).isFile()) continue;
    transformDoc(src, path.join('consensus', name));
  }

  for (const name of fs.readdirSync(path.join(SITE_ROOT, 'blog'))) {
    if (name === 'authors.yml') continue;
    const src = path.join(SITE_ROOT, 'blog', name);
    if (fs.statSync(src).isFile()) transformBlog(src);
  }

  copyDir(path.join(SITE_ROOT, 'static/img'), path.join(WEB_ROOT, 'public/img'));

  console.log('Migration complete.');
  console.log(`  Docs: ${DOCS_OUT}`);
  console.log(`  Blog: ${BLOG_OUT}`);
  console.log(`  Images: ${path.join(WEB_ROOT, 'public/img')}`);
}

main();
