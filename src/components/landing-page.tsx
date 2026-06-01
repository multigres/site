"use client";

import { LandingShardCanvas } from "@/components/landing-shard-canvas";
import { SiteNav } from "@/components/site-nav";
import { Button } from "@/components/ui/button";
import { pageHeadingClassName } from "@/lib/typography";
import { cn } from "@/lib/utils";
import { GithubIcon } from "@/components/github-icon";
import {
  LANDING_ANIMATION_CONFIG,
  type LandingAnimationPhase,
} from "@/lib/landing-animation";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { useEffect, useLayoutEffect, useState } from "react";

// ============================================
// Main Page Component
// ============================================
export default function Home() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [phase, setPhase] = useState<LandingAnimationPhase>("hidden");
  const [isAnimating, setIsAnimating] = useState(false);
  const [gridVisible, setGridVisible] = useState(false);
  const [bottomContentVisible, setBottomContentVisible] = useState(false);

  useLayoutEffect(() => {
    if (!prefersReducedMotion) return;

    setGridVisible(true);
    setBottomContentVisible(true);
    setPhase("complete");
    setIsAnimating(false);
  }, [prefersReducedMotion]);

  // Animation sequence: hidden -> initial (grid fades in) -> zooming -> complete
  useEffect(() => {
    if (prefersReducedMotion) return;

    // Fade in grid immediately
    const fadeInTimer = setTimeout(() => {
      setGridVisible(true);
      setBottomContentVisible(true);
      setPhase("initial");
    }, 100);

    // Start zoom out after initial delay
    const zoomTimer = setTimeout(
      () => {
        setPhase("zooming");
        setIsAnimating(true);
      },
      100 +
        LANDING_ANIMATION_CONFIG.GRID_FADE_DURATION +
        LANDING_ANIMATION_CONFIG.INITIAL_DELAY,
    );

    const completeTimer = setTimeout(
      () => {
        setPhase("complete");
      },
      100 +
        LANDING_ANIMATION_CONFIG.GRID_FADE_DURATION +
        LANDING_ANIMATION_CONFIG.INITIAL_DELAY +
        LANDING_ANIMATION_CONFIG.ZOOM_DURATION,
    );

    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(zoomTimer);
      clearTimeout(completeTimer);
    };
  }, [prefersReducedMotion]);

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-background">
      <SiteNav />

      <LandingShardCanvas
        phase={phase}
        gridVisible={gridVisible}
        isAnimating={isAnimating}
        reduceMotion={prefersReducedMotion}
      />

      {/* Bottom Content — entrance on load; stays put while grid animates above */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20 px-6 pb-12 md:pb-16 md:px-10 lg:px-16"
        style={{
          opacity: bottomContentVisible ? 1 : 0,
          transform: bottomContentVisible
            ? "translateY(0)"
            : "translateY(40px)",
          transition: prefersReducedMotion
            ? "none"
            : `opacity ${LANDING_ANIMATION_CONFIG.CONTENT_FADE_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1), transform ${LANDING_ANIMATION_CONFIG.CONTENT_FADE_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        }}
      >
        <div className="mx-auto grid w-full max-w-6xl gap-x-6 gap-y-6 sm:gap-x-8 lg:grid-cols-[1fr_minmax(0,22rem)] lg:items-end lg:gap-x-16 lg:gap-y-7 xl:grid-cols-[1fr_minmax(0,26rem)] xl:gap-x-24">
          <h1
            className={cn(
              pageHeadingClassName,
              'lg:col-start-1 lg:row-start-1 lg:self-end',
            )}
          >
            <span className="block text-foreground">Postgres</span>
            <span className="block text-muted-foreground/80">
              scaled horizontally.
            </span>
          </h1>

          <p className="max-w-md text-sm leading-relaxed text-muted-foreground/90 sm:text-base lg:col-start-2 lg:row-start-1 lg:self-end">
            A horizontally scalable architecture supporting multi-tenant, highly
            available, and globally distributed deployments. All while staying
            true to standard Postgres.
          </p>

          <div className="flex flex-wrap items-center gap-3 lg:col-start-1 lg:row-start-2">
            <Button asChild size="lg">
              <a href="/docs/">
                <span
                  className="docs-cta-dot inline-block size-2 shrink-0 rounded-full bg-primary"
                  aria-hidden
                />
                Read the docs
              </a>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <a
                href="https://github.com/multigres/multigres"
                target="_blank"
                rel="noreferrer"
              >
                <GithubIcon className="size-4" />
                GitHub
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom fade — blends grid into hero content (see .landing-hero-bottom-fade) */}
      <div
        className="landing-hero-bottom-fade pointer-events-none absolute inset-x-0 bottom-0 z-10"
        style={{
          height: `${LANDING_ANIMATION_CONFIG.BOTTOM_FADE_HEIGHT_VH}vh`,
        }}
        aria-hidden
      />

      {/* Global vignette overlay (see .landing-hero-vignette) */}
      <div
        className="landing-hero-vignette pointer-events-none absolute inset-0 z-10"
        aria-hidden
      />
    </main>
  );
}
