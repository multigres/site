/**
 * Animation configuration for Part 7 Figure 3 - Scenario 2
 */

import type { SVGAnimator } from "../lib/svg-animator";

// Color constants
const COLORS = {
  active: "#2f9e44",
  inactive: "#1e1e1e",
  blue: "#1971c2",
  orange: "#f08c00",
  purple: "#6741d9",
  red: "#ff0000",
} as const;

// Common animation durations
const DURATION = {
  instant: 0,
  normal: 1,
  fast: 0.5,
  slow: 2,
} as const;

// Helper function to hide multiple elements
const hideElements = (animator: SVGAnimator, elements: string[]) => {
  elements.forEach((el) => animator.set(el, { autoAlpha: 0 }));
  return animator;
};

/**
 * Animation sequence for part07-fig3.svg - Scenario 2
 * C6 recruits N3, N4 and N5 for revocation and candidacy
 *
 * Available IDs in SVG (nodes N1-N6 with states t2-t5, v2-v5 and arrows between them):
 * - n1t3-n1t5, n1v3-n1v5: N1's term/value at different states
 * - n2t3-n2t5, n2v3-n2v5: N2's term/value at different states
 * - n3t3-n3t5, n3v3-n3v5: N3's term/value at different states
 * - n4t3-n4t5, n4v3-n4v5: N4's term/value at different states
 * - n5t2-n5t5, n5v2-n5v5: N5's term/value at different states
 * - n6t3-n6t5, n6v3-n6v5: N6's term/value at different states
 * - Arrows: n1n6, n3n5, n4n1, n4n2, n4n3, n4n5, n4n6, n5n3, n5n4
 * - Arrow text: corresponding *text suffix for each arrow
 */
export const part07Fig3Scenario2 = (animator: SVGAnimator) => {
  // Initial state: Hide all elements except N1 slots 3 and 4
  hideElements(animator, [
    // N1 elements (slots 3 and 4 are visible initially, only hide slot 5)
    "#n1t5",
    "#n1v5",
    // N2 elements (slot 3 is visible initially)
    "#n2t4",
    "#n2v4",
    "#n2t5",
    "#n2v5",
    // N3 elements
    "#n3t3",
    "#n3v3",
    "#n3t4",
    "#n3v4",
    "#n3t5",
    "#n3v5",
    // N4 elements
    "#n4t3",
    "#n4v3",
    "#n4t4",
    "#n4v4",
    "#n4t5",
    "#n4v5",
    // N5 elements
    "#n5t2",
    "#n5v2",
    "#n5t3",
    "#n5v3",
    "#n5t4",
    "#n5v4",
    "#n5t5",
    "#n5v5",
    // N6 elements
    "#n6t3",
    "#n6v3",
    "#n6t4",
    "#n6v4",
    "#n6t5",
    "#n6v5",
    // Arrows
    "#n1n6",
    "#n1n6text",
    "#n3n5",
    "#n3n5text",
    "#n4n1",
    "#n4n1text",
    "#n4n2",
    "#n4n2text",
    "#n4n3",
    "#n4n3text",
    "#n4n5",
    "#n4n5text",
    "#n4n6",
    "#n4n6text",
    "#n5n3",
    "#n5n3text",
    "#n5n4",
    "#n5n4text",
    // Descriptions
    "#desc1",
    "#desc2",
    "#desc3",
    "#desc4",
    "#desc5",
  ]);

  // Step 1: C6 recruits N3, N4 and N5
  animator
    .show("#n3", { fill: COLORS.active })
    .show("#n4", { fill: COLORS.active })
    .show("#n5", { fill: COLORS.active })
    .morphText("#desc1", "* C6 recruits N3, N4 and N5")
    .show("#desc1", { autoAlpha: 1, fill: COLORS.active });

  animator.addLabel("step1");

  // Step 2: N3 appends 5-B to N5
  animator
    .morphText("#n3n5text", "Append 5-B")
    .animateArrow("#n3n5", { duration: DURATION.normal })
    .show("#n3n5text", { autoAlpha: 1 })
    .wait(DURATION.fast)
    .show("#n5t2", { autoAlpha: 1 })
    .show("#n5v2", { autoAlpha: 1 })
    .morphText("#desc2", "* N3 appends 5-B to N5")
    .show("#desc2", { autoAlpha: 1, fill: COLORS.active });

  animator.addLabel("step2");

  // Step 3: N3 appends 6-ok to itself and appends to N5
  animator
    .wait(DURATION.fast)
    .show("#n3t3", { autoAlpha: 1 })
    .show("#n3v3", { autoAlpha: 1 })
    .unanimateArrow("#n3n5", { duration: DURATION.instant })
    .set("#n3n5text", { autoAlpha: 0 })
    .morphText("#n3n5text", "Append 6-ok")
    .animateArrow("#n3n5", { duration: DURATION.normal })
    .show("#n3n5text", { autoAlpha: 1 })
    .wait(DURATION.fast)
    .show("#n5t3", { autoAlpha: 1 })
    .show("#n5v3", { autoAlpha: 1 })
    .morphText("#desc3", "* N3 appends 6-ok to itself and N5")
    .show("#desc3", { autoAlpha: 1, fill: COLORS.active });

  animator.addLabel("step3");

  // Step 4: C6 crashes
  animator
    .morphText("#desc4", "* C6 crashes")
    .show("#desc4", { autoAlpha: 1, fill: COLORS.red });

  animator.addLabel("step4");
};
