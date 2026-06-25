import { createMiddleware, createStart } from '@tanstack/react-start';
import { getNegotiator } from 'fumadocs-core/negotiation';
import { blogRoute, docsRoute } from '@/lib/shared';
import { getLLMText, markdownPathToSlugs, source } from '@/lib/source';
import { getBlogLLMText, blogSource } from '@/lib/blog-source.server';
import homepageMarkdown from './content/homepage.md?raw';

const LIVE_FETCH_UA_RE =
  /(?<![A-Za-z0-9])(?:Claude-User|Claude-Web|ChatGPT-User|PerplexityBot)(?![A-Za-z0-9-])/i;

function isLiveFetchAgent(request: Request): boolean {
  const ua = (request.headers.get('user-agent') ?? '').slice(0, 512);
  return LIVE_FETCH_UA_RE.test(ua);
}

function prefersMarkdownByAccept(request: Request): boolean {
  const preferred = getNegotiator(request).mediaTypes(['text/html', 'text/markdown'])[0];
  return preferred === 'text/markdown';
}

function wantsMarkdown(request: Request): boolean {
  return isLiveFetchAgent(request) || prefersMarkdownByAccept(request);
}

function markdownResponse(body: string): Response {
  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=86400',
      Vary: 'Accept',
    },
  });
}

const MARKDOWN_EXT = '.md';

const llmMiddleware = createMiddleware().server(async ({ next, request }) => {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const explicitMarkdown = pathname.endsWith(MARKDOWN_EXT);

  // Explicit `.md` URLs always serve markdown; bare URLs only when the client prefers it.
  if (!explicitMarkdown && !wantsMarkdown(request)) {
    return next();
  }

  const path = explicitMarkdown ? pathname.slice(0, -MARKDOWN_EXT.length) : pathname;

  if (path === '/' || path === '') {
    return markdownResponse(homepageMarkdown);
  }

  if (path.startsWith(docsRoute)) {
    const slugs = markdownPathToSlugs(
      path.slice(docsRoute.length).split('/').filter((v) => v.length > 0),
    );
    const page = source.getPage(slugs);
    if (page) return markdownResponse(await getLLMText(page));
  } else if (path.startsWith(blogRoute)) {
    const slugs = path
      .slice(blogRoute.length)
      .split('/')
      .filter((v) => v.length > 0);
    const page = blogSource.getPage(slugs);
    if (page) return markdownResponse(await getBlogLLMText(page));
  }

  return next();
});

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [llmMiddleware],
  };
});
