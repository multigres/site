import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      enabled: false,
      url: '/',
      title: appName,
    },
    searchToggle: { enabled: false },
    themeSwitch: { enabled: false },
    links: [],
  };
}
