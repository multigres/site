/**
 * GSAP Animation Wrapper for SVG Components
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
  static readonly COLORS = {
    active: "#2f9e44",
    inactive: "#ddd",
    blue: "#70bafb",
    orange: "#af5900",
    purple: "#e99cfe",
    red: "#f97f81",
  } as const;

  static readonly DURATION = {
    instant: 0,
    fast: 0.5,
    normal: 1,
    pause: 0.5,
    slow: 2,
  } as const;

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

  getTimeline(): gsap.core.Timeline {
    return this.timeline;
  }

  private select(selector: string): Element[] {
    if (!this.svg) return [];
    return Array.from(this.svg.querySelectorAll(selector));
  }

  set(selector: string, properties: gsap.TweenVars): this {
    const elements = this.select(selector);
    if (elements.length === 0) {
      console.warn(`No elements found for selector: ${selector}`);
      return this;
    }
    gsap.set(elements, properties);
    return this;
  }

  hideElements(selectors: string[]): this {
    selectors.forEach((selector) => this.set(selector, { autoAlpha: 0 }));
    return this;
  }

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

  show(selector: string, properties: gsap.TweenVars = {}): this {
    const elements = this.select(selector);
    if (elements.length === 0) {
      console.warn(`No elements found for selector: ${selector}`);
      return this;
    }

    const allElements: Element[] = [];
    elements.forEach((element) => {
      allElements.push(element);
      allElements.push(...Array.from(element.querySelectorAll("*")));
    });

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

  morphText(
    selector: string,
    newText: string,
    options: AnimationOptions = {},
  ): this {
    const elements = this.select(selector);
    if (elements.length === 0) return this;

    elements.forEach((element) => {
      if (element instanceof SVGTextElement) {
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
              if (tempObj.value < 0.5) {
                const progress = tempObj.value * 2;
                element.style.opacity = String(1 - progress);
                element.style.transform = `scale(${1 - progress * 0.3})`;
              } else {
                if (element.textContent !== newText) {
                  element.textContent = newText;
                }
                const progress = (tempObj.value - 0.5) * 2;
                element.style.opacity = String(progress);
                element.style.transform = `scale(${0.7 + progress * 0.3})`;
              }
            },
            onReverseComplete: () => {
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

  animateArrow(groupSelector: string, options: AnimationOptions = {}): this {
    const groups = this.select(groupSelector);
    if (groups.length === 0) {
      console.warn(`No arrow group found for selector: ${groupSelector}`);
      return this;
    }

    groups.forEach((group) => {
      const children = Array.from(group.children);
      if (children.length === 0) return;

      this.timeline.to(
        group,
        {
          autoAlpha: 1,
          duration: 0.01,
        },
        this.groupStartTime ?? undefined,
      );

      const firstChild = children[0];
      let shaftPath: SVGGeometryElement | null = null;

      if (firstChild instanceof SVGGeometryElement) {
        shaftPath = firstChild;
      } else {
        const pathElement = firstChild.querySelector(
          "path, line, polyline, polygon",
        );
        if (pathElement instanceof SVGGeometryElement) {
          shaftPath = pathElement;
        }
      }

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

      const restElements: Element[] = [];
      for (let i = 1; i < children.length; i++) {
        restElements.push(children[i]);
        restElements.push(...Array.from(children[i].querySelectorAll("*")));
      }

      if (restElements.length > 0) {
        gsap.set(restElements, { opacity: 0 });
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

  unanimateArrow(groupSelector: string, options: AnimationOptions = {}): this {
    const groups = this.select(groupSelector);
    if (groups.length === 0) {
      console.warn(`No arrow group found for selector: ${groupSelector}`);
      return this;
    }

    groups.forEach((group) => {
      const children = Array.from(group.children);
      if (children.length === 0) return;

      const firstChild = children[0];
      let shaftPath: SVGGeometryElement | null = null;

      if (firstChild instanceof SVGGeometryElement) {
        shaftPath = firstChild;
      } else {
        const pathElement = firstChild.querySelector(
          "path, line, polyline, polygon",
        );
        if (pathElement instanceof SVGGeometryElement) {
          shaftPath = pathElement;
        }
      }

      const restElements: Element[] = [];
      for (let i = 1; i < children.length; i++) {
        restElements.push(children[i]);
        restElements.push(...Array.from(children[i].querySelectorAll("*")));
      }

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

      this.timeline.to(group, {
        autoAlpha: 0,
        duration: 0.01,
        onComplete: options.onComplete,
      });
    });

    return this;
  }

  group(callback: (animator: SVGAnimator) => void): this {
    this.groupStartTime = this.timeline.duration();
    callback(this);
    this.groupStartTime = null;
    return this;
  }

  wait(duration: number): this {
    this.timeline.add(() => {}, `+=${duration}`);
    return this;
  }

  addLabel(label: string): this {
    this.timeline.addLabel(label);
    this.steps.push(label);
    return this;
  }

  nextStep(): this {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this.timeline.tweenTo(this.steps[this.currentStep]);
    }
    return this;
  }

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

  getCurrentStep(): number {
    return this.currentStep;
  }

  getTotalSteps(): number {
    return this.steps.length;
  }

  hasNextStep(): boolean {
    return this.currentStep < this.steps.length - 1;
  }

  hasPreviousStep(): boolean {
    return this.currentStep >= 0;
  }

  play(): this {
    this.timeline.play();
    return this;
  }

  pause(): this {
    this.timeline.pause();
    return this;
  }

  restart(): this {
    this.timeline.restart();
    return this;
  }

  seek(timeOrLabel: number | string): this {
    this.timeline.seek(timeOrLabel);
    return this;
  }

  reverse(): this {
    this.timeline.reverse();
    return this;
  }

  kill(): void {
    this.timeline.kill();
  }
}

export function createSVGAnimator(
  svgSelector: string | SVGElement,
): SVGAnimator {
  return new SVGAnimator(svgSelector);
}

export const animations = {
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

  highlightFlow: (
    animator: SVGAnimator,
    flowSelector: string,
    options: AnimationOptions = {},
  ) => {
    animator.pulse(flowSelector, { duration: 0.8, ...options });
    return animator;
  },
};
