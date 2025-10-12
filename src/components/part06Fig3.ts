/**
 * Animation configuration for Part 6 Figure 3 - All possible leaders
 */

import type { SVGAnimator } from "../lib/svg-animator";

// Common animation durations
const DURATION = {
  instant: 0,
  normal: 1,
  fast: 0.5,
} as const;

// Helper function to hide multiple elements
const hideElements = (animator: SVGAnimator, elements: string[]) => {
  elements.forEach((el) => animator.set(el, { autoAlpha: 0 }));
  return animator;
};

/**
 * Animation sequence for part06-fig3.svg - All possible leaders
 */
export const part06Fig3 = (animator: SVGAnimator) => {
  // Initial state: Hide all arrows
  hideElements(animator, [
    "#blue",
    "#blue1",
    "#blue2",
    "#blue3",
    "#blue4",
    "#purple",
    "#purple1",
    "#purple2",
    "#purple3",
    "#purple4",
    "#green",
    "#green1",
    "#green2",
    "#green3",
    "#green4",
    "#green5",
    "#green6",
  ]);

  // Step 1: Animate blue arrows (revocation for N1)
  animator
    .animateArrow("#blue1", { duration: DURATION.normal })
    .animateArrow("#blue2", { duration: DURATION.normal })
    .animateArrow("#blue3", { duration: DURATION.normal })
    .animateArrow("#blue4", { duration: DURATION.normal })
    .show("#blue", { autoAlpha: 1 })
    .addLabel("step1");

  // Step 2: Animate purple arrows (revocation for N4)
  // Hide blue arrows first
  animator
    .show("#blue1", { autoAlpha: 0 })
    .show("#blue2", { autoAlpha: 0 })
    .show("#blue3", { autoAlpha: 0 })
    .show("#blue4", { autoAlpha: 0 });

  animator
    .animateArrow("#purple1", { duration: DURATION.normal })
    .animateArrow("#purple2", { duration: DURATION.normal })
    .animateArrow("#purple3", { duration: DURATION.normal })
    .animateArrow("#purple4", { duration: DURATION.normal })
    .show("#purple", { autoAlpha: 1 })
    .addLabel("step2");

  // Step 3: Animate green arrows (candidacy for N4)
  // Hide purple arrows first
  animator
    .show("#purple1", { autoAlpha: 0 })
    .show("#purple2", { autoAlpha: 0 })
    .show("#purple3", { autoAlpha: 0 })
    .show("#purple4", { autoAlpha: 0 });

  animator
    .animateArrow("#green1", { duration: DURATION.normal })
    .animateArrow("#green2", { duration: DURATION.normal })
    .animateArrow("#green3", { duration: DURATION.normal })
    .animateArrow("#green4", { duration: DURATION.normal })
    .animateArrow("#green5", { duration: DURATION.normal })
    .animateArrow("#green6", { duration: DURATION.normal })
    .show("#green", { autoAlpha: 1 })
    .addLabel("step3");

  // Step 4: Hide green arrows
  animator
    .show("#green1", { autoAlpha: 0 })
    .show("#green2", { autoAlpha: 0 })
    .show("#green3", { autoAlpha: 0 })
    .show("#green4", { autoAlpha: 0 })
    .show("#green5", { autoAlpha: 0 })
    .show("#green6", { autoAlpha: 0 })
    .addLabel("step4");
};
