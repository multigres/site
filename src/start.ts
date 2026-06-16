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
  const preferred = getNegotiator(request).mediaTypes(['text/markdown', 'text/html'])[0];
  return preferred === 'text/markdown';
}

function wantsMarkdown(request: Request): boolean {
  return isLiveFetchAgent(request) || prefersMarkdownByAccept(request);
}

function markdownResponse(body: string): Response {
  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      Vary: 'Accept',
    },
  });
}

const llmMiddleware = createMiddleware().server(async ({ next, request }) => {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (pathname.endsWith('.md') || !wantsMarkdown(request)) {
    return next();
  }

  if (pathname === '/') {
    return markdownResponse(homepageMarkdown);
  }

  if (pathname.startsWith(docsRoute)) {
    const slugs = markdownPathToSlugs(
      pathname.slice(docsRoute.length).split('/').filter((v) => v.length > 0),
    );
    const page = source.getPage(slugs);
    if (!page) return next();
    return markdownResponse(await getLLMText(page));
  }

  if (pathname.startsWith(blogRoute)) {
    const slugs = pathname
      .slice(blogRoute.length)
      .split('/')
      .filter((v) => v.length > 0);
    const page = blogSource.getPage(slugs);
    if (!page) return next();
    return markdownResponse(await getBlogLLMText(page));
  }

  return next();
});

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [llmMiddleware],
  };
});
