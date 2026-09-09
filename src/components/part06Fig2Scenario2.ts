/**
 * Animation configuration for Part 6 Figure 2 - Scenario 2: newer term steals nodes
 */

import { SVGAnimator } from "../lib/svg-animator";

const COLORS = SVGAnimator.COLORS;
const DURATION = SVGAnimator.DURATION;

/**
 * Animation sequence for part06-fig2.svg - Scenario 2
 */
export const part06Fig2Scenario2 = (animator: SVGAnimator) => {
  // Initial state: Hide all arrows and their text
  animator.hideElements([
    "#c6n3",
    "#c6n3text",
    "#c6n4",
    "#c6n4text",
    "#c6n5",
    "#c6n5text",
    "#c6n5fail",
    "#c6n5failtext",
    "#c7n2",
    "#c7n2text",
    "#c7n5",
    "#c7n5text",
    "#c7n6",
    "#c7n6text",
    "#n1n2",
    "#n1n3",
    "#n1n3text",
    "#np",
    "#nptext1",
    "#nptext2",
  ]);

  // Set initial text before animation steps
  animator.setText("#desc0", "Scenario 2: New term steals nodes");

  // Step 1: C6 recruits N3, C7 recruits N2
  animator
    .animateArrow("#c6n3", { duration: DURATION.normal })
    .show("#c6n3text", { autoAlpha: 1 })
    .changeText("#n3term", "6", COLORS.active, DURATION.fast)
    .animateArrow("#c7n2", { duration: DURATION.normal })
    .show("#c7n2text", { autoAlpha: 1 })
    .changeText("#n2term", "7", COLORS.blue, DURATION.fast)
    .show("#desc1", { fill: COLORS.active })
    .morphText("#desc1", "* C6 and C7 revoke N1 using different nodes", {
      duration: DURATION.normal,
    })
    .addLabel("step1");

  // Step 2: C7 recruits N5 and N6
  animator
    .show("#c6n3", { autoAlpha: 0 })
    .show("#c6n3text", { autoAlpha: 0 })
    .show("#c7n2", { autoAlpha: 0 })
    .show("#c7n2text", { autoAlpha: 0 })
    .animateArrow("#c7n5", { duration: DURATION.normal })
    .show("#c7n5text", { autoAlpha: 1 })
    .changeText("#n5term", "7", COLORS.blue, DURATION.fast)
    .animateArrow("#c7n6", { duration: DURATION.normal })
    .show("#c7n6text", { autoAlpha: 1 })
    .changeText("#n6term", "7", COLORS.blue, DURATION.fast)
    .show("#desc1", { fill: COLORS.inactive })
    .show("#desc2", { fill: COLORS.blue })
    .morphText("#desc2", "* C7 recruits N5 and N6")
    .addLabel("step2");

  // Step 3: C6 fails to recruit N5
  animator
    .animateArrow("#c6n5fail", { duration: DURATION.normal })
    .show("#c6n5failtext", { autoAlpha: 1 })
    .show("#desc2", { fill: COLORS.inactive })
    .show("#desc3", { fill: COLORS.red })
    .morphText("#desc3", "* C6 cannot recruit N5 because")
    .show("#desc4", { fill: COLORS.red })
    .morphText("#desc4", "  of its higher term")
    .addLabel("step3");
};
