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
  private steps: string[] = [];
  private currentStep: number = -1;
  private groupStartTime: number | null = null;

  constructor(svgSelector: string | SVGElement) {
    if (typeof svgSelector === "string") {
      this.svg = document.querySelector(svgSelector);
    } else {
      this.svg = svgSelector;
    }

    if (!this.svg) {
      console.warn(`SVG element not found: ${svgSelector}`);
    }

    this.timeline = gsap.timeline({ paused: true });
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
   * Set properties on elements immediately (before timeline starts)
   */
  set(selector: string, properties: gsap.TweenVars): this {
    const elements = this.select(selector);
    if (elements.length === 0) {
      console.warn(`No elements found for selector: ${selector}`);
      return this;
    }

    // Use immediate gsap.set for initial setup (before timeline plays)
    gsap.set(elements, properties);
    return this;
  }

  /**
   * Set text content immediately without adding to timeline
   */
  setText(selector: string, text: string): this {
    const elements = this.select(selector);
    if (elements.length === 0) {
      console.warn(`No elements found for selector: ${selector}`);
      return this;
    }

    elements.forEach((element) => {
      if (element instanceof SVGTextElement) {
        element.textContent = text;
      }
    });
    return this;
  }

  /**
   * Change text with animation: clear, set color, then morph to new text
   * Common pattern: clear text -> set color -> morph to new text
   */
  changeText(
    selector: string,
    text: string,
    fill: string,
    duration: number = 0.5,
  ): this {
    this.morphText(selector, "", { duration: 0 })
      .show(selector, { fill })
      .morphText(selector, text, { duration });
    return this;
  }

  /**
   * Set properties on elements as part of the timeline animation
   * Uses a very short duration so it works with reverse navigation
   */
  show(selector: string, properties: gsap.TweenVars = {}): this {
    const elements = this.select(selector);
    if (elements.length === 0) {
      console.warn(`No elements found for selector: ${selector}`);
      return this;
    }

    // Collect all child elements as well
    const allElements: Element[] = [];
    elements.forEach((element) => {
      allElements.push(element);
      allElements.push(...Array.from(element.querySelectorAll("*")));
    });

    // Use a very short duration animation instead of set() so it reverses properly
    this.timeline.to(
      allElements,
      {
        ...properties,
        duration: 0.01,
      },
      this.groupStartTime ?? undefined,
    );
    return this;
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
    this.timeline.to(
      elements,
      {
        opacity: 1,
        duration: options.duration ?? 0.5,
        delay: options.delay ?? 0,
        ease: options.ease ?? "power2.out",
        stagger: options.stagger ?? 0,
        onComplete: options.onComplete,
        onStart: options.onStart,
      },
      this.groupStartTime ?? undefined,
    );

    return this;
  }

  /**
   * Fade out elements
   */
  fadeOut(selector: string, options: AnimationOptions = {}): this {
    const elements = this.select(selector);
    if (elements.length === 0) return this;

    this.timeline.to(
      elements,
      {
        opacity: 0,
        duration: options.duration ?? 0.5,
        delay: options.delay ?? 0,
        ease: options.ease ?? "power2.out",
        stagger: options.stagger ?? 0,
        onComplete: options.onComplete,
        onStart: options.onStart,
      },
      this.groupStartTime ?? undefined,
    );

    return this;
  }

  /**
   * Scale animation
   */
  scale(selector: string, scale: number, options: AnimationOptions = {}): this {
    const elements = this.select(selector);
    if (elements.length === 0) return this;

    this.timeline.to(
      elements,
      {
        scale,
        duration: options.duration ?? 0.5,
        delay: options.delay ?? 0,
        ease: options.ease ?? "back.out(1.7)",
        stagger: options.stagger ?? 0,
        transformOrigin: "center center",
        onComplete: options.onComplete,
        onStart: options.onStart,
      },
      this.groupStartTime ?? undefined,
    );

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

    this.timeline.to(
      elements,
      {
        strokeDashoffset: 0,
        duration: options.duration ?? 1,
        delay: options.delay ?? 0,
        ease: options.ease ?? "power2.inOut",
        stagger: options.stagger ?? 0,
        onComplete: options.onComplete,
        onStart: options.onStart,
      },
      this.groupStartTime ?? undefined,
    );

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

    this.timeline.to(
      elements,
      {
        x: 0,
        y: 0,
        opacity: 1,
        duration: options.duration ?? 0.8,
        delay: options.delay ?? 0,
        ease: options.ease ?? "power3.out",
        stagger: options.stagger ?? 0,
        onComplete: options.onComplete,
        onStart: options.onStart,
      },
      this.groupStartTime ?? undefined,
    );

    return this;
  }

  /**
   * Move element from one point to another
   * @param selector - CSS selector for elements to move
   * @param from - Starting position {x, y} or null to move from current position
   * @param to - Ending position {x, y}
   * @param options - Animation options
   */
  moveTo(
    selector: string,
    from: { x: number; y: number } | null,
    to: { x: number; y: number },
    options: AnimationOptions = {},
  ): this {
    const elements = this.select(selector);
    if (elements.length === 0) {
      console.warn(`No elements found for selector: ${selector}`);
      return this;
    }

    // Set initial position if provided
    if (from !== null) {
      this.timeline.set(
        elements,
        {
          x: from.x,
          y: from.y,
        },
        this.groupStartTime ?? undefined,
      );
    }

    // Animate to target position
    this.timeline.to(
      elements,
      {
        x: to.x,
        y: to.y,
        duration: options.duration ?? 1,
        delay: options.delay ?? 0,
        ease: options.ease ?? "power2.inOut",
        stagger: options.stagger ?? 0,
        onComplete: options.onComplete,
        onStart: options.onStart,
      },
      this.groupStartTime ?? undefined,
    );

    return this;
  }

  /**
   * Highlight element with pulse animation
   */
  pulse(selector: string, options: AnimationOptions = {}): this {
    const elements = this.select(selector);
    if (elements.length === 0) return this;

    this.timeline.to(
      elements,
      {
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
      },
      this.groupStartTime ?? undefined,
    );

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
        // Capture the current text at the time this morphText is called
        // This is what we'll restore when THIS specific tween reverses
        const previousText = element.textContent || "";
        const tempObj = { value: 0 };

        this.timeline.to(
          tempObj,
          {
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
            onReverseComplete: () => {
              // Restore the text from before this specific morphText call
              element.textContent = previousText;
              element.style.opacity = "1";
              element.style.transform = "scale(1)";
            },
            onComplete: () => {
              element.style.opacity = "1";
              element.style.transform = "scale(1)";
              if (options.onComplete) options.onComplete();
            },
            onStart: options.onStart,
          },
          this.groupStartTime ?? undefined,
        );
      }
    });

    return this;
  }

  /**
   * Animate an arrow group where first element is the shaft and rest are arrowhead/decorations
   * The shaft is drawn first, then other elements fade in
   */
  animateArrow(groupSelector: string, options: AnimationOptions = {}): this {
    const groups = this.select(groupSelector);
    if (groups.length === 0) {
      console.warn(`No arrow group found for selector: ${groupSelector}`);
      return this;
    }

    groups.forEach((group) => {
      const children = Array.from(group.children);
      if (children.length === 0) return;

      // We assume elements are hidden initially.
      // Make them visible.
      this.timeline.to(
        group,
        {
          autoAlpha: 1,
          duration: 0.01,
        },
        this.groupStartTime ?? undefined,
      );

      // First child contains the shaft - find the actual path element
      const firstChild = children[0];
      let shaftPath: SVGGeometryElement | null = null;

      // Check if first child is the path itself
      if (firstChild instanceof SVGGeometryElement) {
        shaftPath = firstChild;
      } else {
        // Look for a path element inside the first child
        const pathElement = firstChild.querySelector(
          "path, line, polyline, polygon",
        );
        if (pathElement instanceof SVGGeometryElement) {
          shaftPath = pathElement;
        }
      }

      // Animate the shaft using drawPath
      if (shaftPath) {
        let shaftSelector = "";
        if (shaftPath.id) {
          shaftSelector = `#${shaftPath.id}`;
        } else {
          shaftSelector = `${groupSelector} > :first-child path, ${groupSelector} > :first-child line, ${groupSelector} > :first-child polyline, ${groupSelector} > :first-child polygon`;
        }

        this.drawPath(shaftSelector, {
          duration: options.duration ?? 1,
          delay: options.delay ?? 0,
          ease: options.ease ?? "none",
          onStart: options.onStart,
        });
      }

      // Remaining children are arrowhead/decorations - collect all descendants
      const restElements: Element[] = [];
      for (let i = 1; i < children.length; i++) {
        restElements.push(children[i]);
        // Also collect nested elements
        restElements.push(...Array.from(children[i].querySelectorAll("*")));
      }

      if (restElements.length > 0) {
        gsap.set(restElements, { opacity: 0 });
        // Don't use groupStartTime - arrowhead should appear AFTER shaft
        this.timeline.to(restElements, {
          opacity: 1,
          duration: 0,
          onComplete: options.onComplete,
        });
      } else if (options.onComplete) {
        this.timeline.call(options.onComplete);
      }
    });

    return this;
  }

  /**
   * Reverse of animateArrow - fades out arrowhead first, then un-draws the shaft
   */
  unanimateArrow(groupSelector: string, options: AnimationOptions = {}): this {
    const groups = this.select(groupSelector);
    if (groups.length === 0) {
      console.warn(`No arrow group found for selector: ${groupSelector}`);
      return this;
    }

    groups.forEach((group) => {
      const children = Array.from(group.children);
      if (children.length === 0) return;

      // First child contains the shaft - find the actual path element
      const firstChild = children[0];
      let shaftPath: SVGGeometryElement | null = null;

      // Check if first child is the path itself
      if (firstChild instanceof SVGGeometryElement) {
        shaftPath = firstChild;
      } else {
        // Look for a path element inside the first child
        const pathElement = firstChild.querySelector(
          "path, line, polyline, polygon",
        );
        if (pathElement instanceof SVGGeometryElement) {
          shaftPath = pathElement;
        }
      }

      // Remaining children are arrowhead/decorations - collect all descendants
      const restElements: Element[] = [];
      for (let i = 1; i < children.length; i++) {
        restElements.push(children[i]);
        // Also collect nested elements
        restElements.push(...Array.from(children[i].querySelectorAll("*")));
      }

      // First, fade out the arrowhead
      if (restElements.length > 0) {
        this.timeline.to(
          restElements,
          {
            opacity: 0,
            duration: 0.001,
            onStart: options.onStart,
          },
          this.groupStartTime ?? undefined,
        );
      }

      // Then un-draw the shaft
      if (shaftPath) {
        let shaftSelector = "";
        if (shaftPath.id) {
          shaftSelector = `#${shaftPath.id}`;
        } else {
          shaftSelector = `${groupSelector} > :first-child path, ${groupSelector} > :first-child line, ${groupSelector} > :first-child polyline, ${groupSelector} > :first-child polygon`;
        }

        const elements = this.select(shaftSelector);
        elements.forEach((element) => {
          if (element instanceof SVGGeometryElement) {
            const length = element.getTotalLength();
            // Animate from drawn (offset 0) back to hidden (offset = length)
            this.timeline.to(
              element,
              {
                strokeDashoffset: length,
                duration: options.duration ?? 1,
                delay: options.delay ?? 0,
                ease: options.ease ?? "none",
              },
              this.groupStartTime ?? undefined,
            );
          }
        });
      }

      // Finally, hide the entire group
      this.timeline.to(group, {
        autoAlpha: 0,
        duration: 0.01,
        onComplete: options.onComplete,
      });
    });

    return this;
  }

  /**
   * Group animations to run simultaneously
   * Creates a nested timeline where all animations in the callback run at the same time
   */
  group(callback: (animator: SVGAnimator) => void): this {
    // Mark the start position for the group
    this.groupStartTime = this.timeline.duration();

    // Execute the callback - all animations will be added at groupStartTime
    callback(this);

    // Reset groupStartTime so subsequent animations continue sequentially
    this.groupStartTime = null;

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
    this.steps.push(label);
    return this;
  }

  /**
   * Move to the next step in the animation
   */
  nextStep(): this {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this.timeline.tweenTo(this.steps[this.currentStep]);
    }
    return this;
  }

  /**
   * Move to the previous step in the animation
   */
  previousStep(): this {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.timeline.tweenTo(this.steps[this.currentStep]);
    } else if (this.currentStep === 0) {
      this.currentStep = -1;
      this.timeline.tweenTo(0);
    }
    return this;
  }

  /**
   * Get the current step index
   */
  getCurrentStep(): number {
    return this.currentStep;
  }

  /**
   * Get the total number of steps
   */
  getTotalSteps(): number {
    return this.steps.length;
  }

  /**
   * Check if there's a next step
   */
  hasNextStep(): boolean {
    return this.currentStep < this.steps.length - 1;
  }

  /**
   * Check if there's a previous step
   */
  hasPreviousStep(): boolean {
    return this.currentStep >= 0;
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
