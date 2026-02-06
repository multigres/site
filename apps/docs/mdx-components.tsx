import type { MDXComponents } from 'mdx/types';
import defaultComponents from 'fumadocs-ui/mdx';
import AnimatedSVG from '@/components/AnimatedSVG';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...defaultComponents,
    AnimatedSVG,
    ...components,
  };
}
