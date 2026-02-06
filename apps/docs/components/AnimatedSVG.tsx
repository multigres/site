'use client';

import React, { useEffect, useRef, useState } from "react";
import { SVGAnimator } from "@/lib/svg-animator";

interface AnimatedSVGProps {
  src: string;
  onAnimate?: (animator: SVGAnimator) => void;
  autoPlay?: boolean;
  showControls?: boolean;
  showRestartButton?: boolean;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
  width?: string | number;
  height?: string | number;
}

const AnimatedSVG: React.FC<AnimatedSVGProps> = ({
  src,
  onAnimate,
  autoPlay = false,
  showControls = false,
  showRestartButton = false,
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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

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

        if (width)
          svgElement.style.width =
            typeof width === "number" ? `${width}px` : width;
        if (height)
          svgElement.style.height =
            typeof height === "number" ? `${height}px` : height;

        animatorRef.current = new SVGAnimator(svgElement);
        setIsLoaded(true);

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

    return () => {
      if (animatorRef.current) {
        animatorRef.current.kill();
      }
    };
  }, [src, onAnimate, autoPlay, width, height]);

  const updateButtonStates = () => {
    if (animatorRef.current) {
      setCanGoNext(animatorRef.current.hasNextStep());
    }
  };

  const handleNext = () => {
    if (animatorRef.current) {
      animatorRef.current.nextStep();
      updateButtonStates();
    }
  };

  const handleReset = () => {
    setIsLoaded(false);
    setCanGoNext(true);

    const container = containerRef.current;
    if (!container) return;

    if (animatorRef.current) {
      animatorRef.current.kill();
      animatorRef.current = null;
    }

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

        if (width)
          svgElement.style.width =
            typeof width === "number" ? `${width}px` : width;
        if (height)
          svgElement.style.height =
            typeof height === "number" ? `${height}px` : height;

        animatorRef.current = new SVGAnimator(svgElement);
        setIsLoaded(true);

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
            onClick={handleReset}
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              cursor: "pointer",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "8px",
            }}
          >
            Reset
          </button>
          <button
            onClick={handleNext}
            disabled={!canGoNext}
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              cursor: canGoNext ? "pointer" : "not-allowed",
              opacity: canGoNext ? 1 : 0.5,
              backgroundColor: canGoNext ? "#2f9e44" : undefined,
              color: canGoNext ? "white" : undefined,
              border: canGoNext ? "none" : undefined,
              borderRadius: "8px",
            }}
          >
            Next
          </button>
        </div>
      )}
      {showRestartButton && !showControls && isLoaded && (
        <div
          style={{
            display: "flex",
            marginTop: "10px",
            justifyContent: "center",
          }}
        >
          <button
            onClick={handleReset}
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              cursor: "pointer",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "8px",
            }}
          >
            Replay
          </button>
        </div>
      )}
    </div>
  );
};

export default AnimatedSVG;
