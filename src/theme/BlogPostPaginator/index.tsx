/**
 * Custom BlogPostPaginator override to swap the order of newer/older posts
 * Older post on left, Newer post on right
 */

import React, { type ReactNode } from "react";
import Translate, { translate } from "@docusaurus/Translate";
import PaginatorNavLink from "@theme/PaginatorNavLink";
import type { Props } from "@theme/BlogPostPaginator";

export default function BlogPostPaginator(props: Props): ReactNode {
  const { nextItem, prevItem } = props;

  return (
    <nav
      className="pagination-nav docusaurus-mt-lg"
      aria-label={translate({
        id: "theme.blog.post.paginator.navAriaLabel",
        message: "Blog post page navigation",
        description: "The ARIA label for the blog posts pagination",
      })}
    >
      {nextItem && (
        <PaginatorNavLink
          {...nextItem}
          subLabel={
            <Translate
              id="theme.blog.post.paginator.olderPost"
              description="The blog post button label to navigate to the older/next post"
            >
              Older Post
            </Translate>
          }
        />
      )}
      {prevItem && (
        <PaginatorNavLink
          {...prevItem}
          subLabel={
            <Translate
              id="theme.blog.post.paginator.newerPost"
              description="The blog post button label to navigate to the newer/previous post"
            >
              Newer Post
            </Translate>
          }
          isNext
        />
      )}
    </nav>
  );
}
