/**
 * AnimatedSVG Component
 *
 * A React component wrapper for SVG animations using GSAP.
 * Provides an easy way to add animations to SVG diagrams in Docusaurus.
 *
 * @example
 * ```tsx
 * import AnimatedSVG from '@site/src/components/AnimatedSVG';
 *
 * <AnimatedSVG
 *   src="/img/site/svgviewer-output.svg"
 *   onAnimate={(animator) => {
 *     animator
 *       .fadeIn('g[id="node-1"]', { duration: 1 })
 *       .drawPath('g[id="arrow-1"] path', { duration: 2 })
 *       .play();
 *   }}
 *   autoPlay={true}
 * />
 * ```
 */

import React, { useEffect, useRef, useState } from "react";
import { SVGAnimator } from "../lib/svg-animator";

interface AnimatedSVGProps {
  /** URL or path to the SVG file */
  src: string;
  /** Animation callback that receives the animator instance */
  onAnimate?: (animator: SVGAnimator) => void;
  /** Whether to auto-play the animation on mount */
  autoPlay?: boolean;
  /** Whether to show manual controls (forward/reverse buttons) */
  showControls?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Additional inline styles */
  style?: React.CSSProperties;
  /** Alt text for accessibility */
  alt?: string;
  /** Width of the SVG container */
  width?: string | number;
  /** Height of the SVG container */
  height?: string | number;
}

const AnimatedSVG: React.FC<AnimatedSVGProps> = ({
  src,
  onAnimate,
  autoPlay = false,
  showControls = false,
  className = "",
  style = {},
  alt = "Animated SVG",
  width,
  height,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animatorRef = useRef<SVGAnimator | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [canGoNext, setCanGoNext] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Fetch and inject SVG
    const loadSVG = async () => {
      try {
        const response = await fetch(src);
        const svgText = await response.text();
        container.innerHTML = svgText;

        const svgElement = container.querySelector("svg");
        if (!svgElement) {
          console.error("No SVG element found in the loaded content");
          return;
        }

        // Set dimensions if provided
        if (width)
          svgElement.style.width =
            typeof width === "number" ? `${width}px` : width;
        if (height)
          svgElement.style.height =
            typeof height === "number" ? `${height}px` : height;

        // Create animator instance
        animatorRef.current = new SVGAnimator(svgElement);
        setIsLoaded(true);

        // Call animation callback
        if (onAnimate && animatorRef.current) {
          onAnimate(animatorRef.current);

          if (autoPlay) {
            animatorRef.current.play();
          }
        }
      } catch (error) {
        console.error("Error loading SVG:", error);
      }
    };

    loadSVG();

    // Cleanup
    return () => {
      if (animatorRef.current) {
        animatorRef.current.kill();
      }
    };
  }, [src, onAnimate, autoPlay, width, height]);

  const updateButtonStates = () => {
    if (animatorRef.current) {
      setCanGoNext(animatorRef.current.hasNextStep());
      setCanGoBack(animatorRef.current.hasPreviousStep());
    }
  };

  const handleNext = () => {
    if (animatorRef.current) {
      animatorRef.current.nextStep();
      updateButtonStates();
    }
  };

  const handlePrevious = () => {
    if (animatorRef.current) {
      animatorRef.current.previousStep();
      updateButtonStates();
    }
  };

  return (
    <div>
      <div
        ref={containerRef}
        className={`animated-svg-container ${className}`}
        style={{
          display: "inline-block",
          ...style,
        }}
        role="img"
        aria-label={alt}
      />
      {showControls && isLoaded && (
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginTop: "10px",
            justifyContent: "center",
          }}
        >
          <button
            onClick={handlePrevious}
            disabled={!canGoBack}
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              cursor: canGoBack ? "pointer" : "not-allowed",
              opacity: canGoBack ? 1 : 0.5,
            }}
          >
            ← Previous
          </button>
          <button
            onClick={handleNext}
            disabled={!canGoNext}
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              cursor: canGoNext ? "pointer" : "not-allowed",
              opacity: canGoNext ? 1 : 0.5,
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default AnimatedSVG;
