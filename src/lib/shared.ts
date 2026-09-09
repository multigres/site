export const appName = 'Multigres';
export const siteUrl = 'https://multigres.com';
export const defaultOgImage = `${siteUrl}/img/og-image.png`;
export const docsRoute = '/docs';
export const blogRoute = '/blog';
export const docsImageRoute = '/og/docs';

export function absoluteUrl(pathOrUrl: string) {
  return new URL(pathOrUrl, siteUrl).href;
}

export const gitConfig = {
  user: 'multigres',
  repo: 'multigres',
  branch: 'main',
};
