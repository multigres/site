/**
 * Animation configuration for Part 6 Figure 2 - Scenario 3: newer term starts after scenario 1
 */

import { SVGAnimator } from "../lib/svg-animator";

const COLORS = SVGAnimator.COLORS;
const DURATION = SVGAnimator.DURATION;

/**
 * Animation sequence for part06-fig2.svg - Scenario 3
 */
export const part06Fig2Scenario3 = (animator: SVGAnimator) => {
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
  animator.setText("#desc0", "Scenario 3: New term starts after scenario 1");

  // Step 1: Show scenario 1 completion - C6 recruits N3, N4, N5
  // First group: animate arrows simultaneously
  animator.group((a: SVGAnimator) => {
    a.animateArrow("#c6n3", { duration: DURATION.normal })
      .show("#c6n3text", { autoAlpha: 1 })
      .animateArrow("#c6n5", { duration: DURATION.normal })
      .show("#c6n5text", { autoAlpha: 1 })
      .animateArrow("#c6n4", { duration: DURATION.normal })
      .show("#c6n4text", { autoAlpha: 1 });
  });

  // Second group: change term numbers
  animator.group((a: SVGAnimator) => {
    a.changeText("#n3term", "6", COLORS.active, DURATION.fast)
      .changeText("#n5term", "6", COLORS.active, DURATION.fast)
      .changeText("#n4term", "6", COLORS.active, DURATION.fast);
  });

  animator
    .show("#desc1", { fill: COLORS.active })
    .morphText("#desc1", "* C6 recruits N3, N4, N5", {
      duration: DURATION.normal,
    });

  animator.addLabel("step1");

  // Step 2: C7 recruits N2, N5, N6
  // Hide c6 arrows first
  animator
    .show("#c6n3", { autoAlpha: 0 })
    .show("#c6n3text", { autoAlpha: 0 })
    .show("#c6n4", { autoAlpha: 0 })
    .show("#c6n4text", { autoAlpha: 0 })
    .show("#c6n5", { autoAlpha: 0 })
    .show("#c6n5text", { autoAlpha: 0 });

  // First group: animate arrows simultaneously
  animator.group((a: SVGAnimator) => {
    a.animateArrow("#c7n2", { duration: DURATION.normal })
      .show("#c7n2text", { autoAlpha: 1 })
      .animateArrow("#c7n5", { duration: DURATION.normal })
      .show("#c7n5text", { autoAlpha: 1 })
      .animateArrow("#c7n6", { duration: DURATION.normal })
      .show("#c7n6text", { autoAlpha: 1 });
  });

  // Second group: change term numbers to 7 with blue color
  animator.group((a: SVGAnimator) => {
    a.changeText("#n2term", "7", COLORS.blue, DURATION.fast)
      .changeText("#n5term", "7", COLORS.blue, DURATION.fast)
      .changeText("#n6term", "7", COLORS.blue, DURATION.fast);
  });

  animator
    .show("#desc1", { fill: COLORS.active })
    .show("#desc2", { fill: COLORS.blue })
    .show("#desc3", { fill: COLORS.blue })
    .morphText("#desc2", "* C7 overrides C6 by recruiting N5 and N6", {
      duration: DURATION.normal,
    })
    .morphText("#desc3", "  that were previously recruited by C6", {
      duration: DURATION.instant,
    });

  animator.addLabel("step2");
};
