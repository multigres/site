/**
 * GSAP Animation Wrapper for SVG Components
 *
 * This utility provides a simple interface to animate SVG elements using GSAP.
 * It can be used to create complex animations for architectural diagrams and illustrations.
 *
 * @example
 * ```typescript
 * import { SVGAnimator } from '@site/src/lib/svg-animator';
 *
 * const animator = new SVGAnimator('#my-svg');
 * animator.fadeIn('.node-1', { duration: 1, delay: 0.5 });
 * animator.drawArrow('.arrow-1', { duration: 2 });
 * ```
 */

import gsap from "gsap";

export interface AnimationOptions {
  duration?: number;
  delay?: number;
  ease?: string;
  stagger?: number;
  onComplete?: () => void;
  onStart?: () => void;
}

export class SVGAnimator {
  private svg: SVGElement | null;
  private timeline: gsap.core.Timeline;

  constructor(svgSelector: string | SVGElement) {
    if (typeof svgSelector === "string") {
      this.svg = document.querySelector(svgSelector);
    } else {
      this.svg = svgSelector;
    }

    if (!this.svg) {
      console.warn(`SVG element not found: ${svgSelector}`);
    }

    this.timeline = gsap.timeline();
  }

  /**
   * Get the GSAP timeline for custom animations
   */
  getTimeline(): gsap.core.Timeline {
    return this.timeline;
  }

  /**
   * Select elements within the SVG
   */
  private select(selector: string): Element[] {
    if (!this.svg) return [];
    return Array.from(this.svg.querySelectorAll(selector));
  }

  /**
   * Fade in elements
   */
  fadeIn(selector: string, options: AnimationOptions = {}): this {
    const elements = this.select(selector);
    if (elements.length === 0) {
      console.warn(`No elements found for selector: ${selector}`);
      return this;
    }

    gsap.set(elements, { opacity: 0 });
    this.timeline.to(elements, {
      opacity: 1,
      duration: options.duration ?? 0.5,
      delay: options.delay ?? 0,
      ease: options.ease ?? "power2.out",
      stagger: options.stagger ?? 0,
      onComplete: options.onComplete,
      onStart: options.onStart,
    });

    return this;
  }

  /**
   * Fade out elements
   */
  fadeOut(selector: string, options: AnimationOptions = {}): this {
    const elements = this.select(selector);
    if (elements.length === 0) return this;

    this.timeline.to(elements, {
      opacity: 0,
      duration: options.duration ?? 0.5,
      delay: options.delay ?? 0,
      ease: options.ease ?? "power2.out",
      stagger: options.stagger ?? 0,
      onComplete: options.onComplete,
      onStart: options.onStart,
    });

    return this;
  }

  /**
   * Scale animation
   */
  scale(selector: string, scale: number, options: AnimationOptions = {}): this {
    const elements = this.select(selector);
    if (elements.length === 0) return this;

    this.timeline.to(elements, {
      scale,
      duration: options.duration ?? 0.5,
      delay: options.delay ?? 0,
      ease: options.ease ?? "back.out(1.7)",
      stagger: options.stagger ?? 0,
      transformOrigin: "center center",
      onComplete: options.onComplete,
      onStart: options.onStart,
    });

    return this;
  }

  /**
   * Draw arrow/path animation (stroke-dasharray technique)
   */
  drawPath(selector: string, options: AnimationOptions = {}): this {
    const elements = this.select(selector);
    if (elements.length === 0) return this;

    elements.forEach((element) => {
      if (element instanceof SVGGeometryElement) {
        const length = element.getTotalLength();
        gsap.set(element, {
          strokeDasharray: length,
          strokeDashoffset: length,
        });
      }
    });

    this.timeline.to(elements, {
      strokeDashoffset: 0,
      duration: options.duration ?? 1,
      delay: options.delay ?? 0,
      ease: options.ease ?? "power2.inOut",
      stagger: options.stagger ?? 0,
      onComplete: options.onComplete,
      onStart: options.onStart,
    });

    return this;
  }

  /**
   * Slide in from direction
   */
  slideIn(
    selector: string,
    direction: "left" | "right" | "top" | "bottom" = "left",
    options: AnimationOptions = {},
  ): this {
    const elements = this.select(selector);
    if (elements.length === 0) return this;

    const distance = 100;
    const initialPosition = {
      left: { x: -distance, y: 0 },
      right: { x: distance, y: 0 },
      top: { x: 0, y: -distance },
      bottom: { x: 0, y: distance },
    }[direction];

    gsap.set(elements, {
      x: initialPosition.x,
      y: initialPosition.y,
      opacity: 0,
    });

    this.timeline.to(elements, {
      x: 0,
      y: 0,
      opacity: 1,
      duration: options.duration ?? 0.8,
      delay: options.delay ?? 0,
      ease: options.ease ?? "power3.out",
      stagger: options.stagger ?? 0,
      onComplete: options.onComplete,
      onStart: options.onStart,
    });

    return this;
  }

  /**
   * Highlight element with pulse animation
   */
  pulse(selector: string, options: AnimationOptions = {}): this {
    const elements = this.select(selector);
    if (elements.length === 0) return this;

    this.timeline.to(elements, {
      scale: 1.1,
      duration: (options.duration ?? 0.6) / 2,
      delay: options.delay ?? 0,
      ease: "power2.inOut",
      yoyo: true,
      repeat: 1,
      stagger: options.stagger ?? 0,
      transformOrigin: "center center",
      onComplete: options.onComplete,
      onStart: options.onStart,
    });

    return this;
  }

  /**
   * Morph text content from one value to another with animation
   */
  morphText(
    selector: string,
    newText: string,
    options: AnimationOptions = {},
  ): this {
    const elements = this.select(selector);
    if (elements.length === 0) return this;

    elements.forEach((element) => {
      if (element instanceof SVGTextElement) {
        const originalText = element.textContent || "";
        const tempObj = { value: 0 };

        this.timeline.to(tempObj, {
          value: 1,
          duration: options.duration ?? 0.8,
          delay: options.delay ?? 0,
          ease: options.ease ?? "power2.inOut",
          onUpdate: () => {
            // Fade out and scale down
            if (tempObj.value < 0.5) {
              const progress = tempObj.value * 2; // 0 to 1 in first half
              element.style.opacity = String(1 - progress);
              element.style.transform = `scale(${1 - progress * 0.3})`;
            } else {
              // Change text at midpoint
              if (element.textContent !== newText) {
                element.textContent = newText;
              }
              // Fade in and scale up
              const progress = (tempObj.value - 0.5) * 2; // 0 to 1 in second half
              element.style.opacity = String(progress);
              element.style.transform = `scale(${0.7 + progress * 0.3})`;
            }
          },
          onComplete: () => {
            element.style.opacity = "1";
            element.style.transform = "scale(1)";
            if (options.onComplete) options.onComplete();
          },
          onStart: options.onStart,
        });
      }
    });

    return this;
  }

  /**
   * Add a delay to the timeline
   */
  wait(duration: number): this {
    this.timeline.add(() => {}, `+=${duration}`);
    return this;
  }

  /**
   * Add a label to the timeline for seeking
   */
  addLabel(label: string): this {
    this.timeline.addLabel(label);
    return this;
  }

  /**
   * Play the animation
   */
  play(): this {
    this.timeline.play();
    return this;
  }

  /**
   * Pause the animation
   */
  pause(): this {
    this.timeline.pause();
    return this;
  }

  /**
   * Restart the animation
   */
  restart(): this {
    this.timeline.restart();
    return this;
  }

  /**
   * Seek to a specific time or label
   */
  seek(timeOrLabel: number | string): this {
    this.timeline.seek(timeOrLabel);
    return this;
  }

  /**
   * Reverse the animation
   */
  reverse(): this {
    this.timeline.reverse();
    return this;
  }

  /**
   * Kill the animation
   */
  kill(): void {
    this.timeline.kill();
  }
}

/**
 * Create a new SVG animator instance
 */
export function createSVGAnimator(
  svgSelector: string | SVGElement,
): SVGAnimator {
  return new SVGAnimator(svgSelector);
}

/**
 * Utility function for common animation sequences
 */
export const animations = {
  /**
   * Fade in nodes sequentially, then draw arrows between them
   */
  sequentialReveal: (
    animator: SVGAnimator,
    nodeSelector: string,
    arrowSelector: string,
    options: { nodeDelay?: number; arrowDelay?: number } = {},
  ) => {
    animator
      .fadeIn(nodeSelector, {
        duration: 0.5,
        stagger: 0.2,
        delay: options.nodeDelay ?? 0,
      })
      .drawPath(arrowSelector, {
        duration: 1,
        stagger: 0.3,
        delay: options.arrowDelay ?? 0,
      });
    return animator;
  },

  /**
   * Highlight a specific flow path
   */
  highlightFlow: (
    animator: SVGAnimator,
    flowSelector: string,
    options: AnimationOptions = {},
  ) => {
    animator.pulse(flowSelector, { duration: 0.8, ...options });
    return animator;
  },
};
