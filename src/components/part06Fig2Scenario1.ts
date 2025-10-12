/**
 * Animation configuration for Part 6 Figure 2 - Scenario 1: no race
 */

import type { SVGAnimator } from "../lib/svg-animator";

// Color constants
const COLORS = {
  active: "#2f9e44",
  inactive: "#1e1e1e",
} as const;

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
 * Animation sequence for part06-fig2.svg - Scenario 1
 */
export const part06Fig2Scenario1 = (animator: SVGAnimator) => {
  // Initial state: Hide all arrows and their text
  hideElements(animator, [
    "#c6n3",
    "#c6n3text",
    "#c6n4",
    "#c6n4text",
    "#c6n5",
    "#c6n5text",
    "#c6n5fail",
    "#c6n5failtext",
    "#c7",
    "#c7text",
    "#c7n2",
    "#c7n2text",
    "#c7n5",
    "#c7n5text",
    "#c7n6",
    "#c7n6text",
    "#n1n3",
    "#n1n3text",
  ]);

  // Step 1: C6 recruits N3, show descriptions
  animator
    .animateArrow("#c6n3", { duration: DURATION.normal })
    .show("#c6n3text", { autoAlpha: 1 })
    .changeText("#n3term", "6", COLORS.active, DURATION.fast)
    .animateArrow("#n1n3", { duration: DURATION.normal })
    .show("#n1n3text", { autoAlpha: 1 })
    .show("#desc1", { fill: COLORS.active })
    .morphText("#desc1", "* Recruitment of N3 satisfies", {
      duration: DURATION.normal,
    })
    .show("#desc2", { fill: COLORS.active })
    .morphText("#desc2", "  revocation of N1", { duration: DURATION.instant })
    .addLabel("step1");

  // Step 2: C6 recruits N4 and N5
  animator
    .animateArrow("#c6n5", { duration: DURATION.normal })
    .show("#c6n5text", { autoAlpha: 1 })
    .changeText("#n5term", "6", COLORS.active, DURATION.fast)
    .animateArrow("#c6n4", { duration: DURATION.normal })
    .show("#c6n4text", { autoAlpha: 1 })
    .changeText("#n4term", "6", COLORS.active, DURATION.fast)
    .show("#desc1", { fill: COLORS.inactive })
    .show("#desc2", { fill: COLORS.inactive })
    .show("#desc3", { fill: COLORS.active })
    .morphText("#desc3", "* Recruitment of N4 and N5 satisfies", {
      duration: DURATION.normal,
    })
    .show("#desc4", { fill: COLORS.active })
    .morphText("#desc4", "  candidacy of N4", { duration: DURATION.instant })
    .addLabel("step2");
};
