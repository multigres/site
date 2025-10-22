import React from "react";
import Footer from "@theme-original/BlogPostItem/Footer";
import type FooterType from "@theme/BlogPostItem/Footer";
import type { WrapperProps } from "@docusaurus/types";
import { useLocation } from "@docusaurus/router";
import BlogFooter from "@site/src/components/BlogFooter";

type Props = WrapperProps<typeof FooterType>;

export default function FooterWrapper(props: Props): React.ReactElement {
  const location = useLocation();
  // Only show the custom footer on individual blog post pages (not on list pages)
  // Individual blog posts have paths like /blog/slug, while the list page is just /blog or /blog/
  const isFullBlogPost =
    location.pathname.startsWith("/blog/") &&
    location.pathname !== "/blog/" &&
    !location.pathname.match(/^\/blog\/?$/);

  return (
    <>
      <Footer {...props} />
      {isFullBlogPost && <BlogFooter />}
    </>
  );
}
