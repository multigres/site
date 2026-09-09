/**
 * Animation configuration for Part 6 Figure 1 - Revocation methods
 */

import { SVGAnimator } from "../lib/svg-animator";

const COLORS = SVGAnimator.COLORS;
const DURATION = SVGAnimator.DURATION;

/**
 * Animation sequence for part06-fig1.svg
 */
export const part06Fig1 = (animator: SVGAnimator) => {
  // Initial state: Hide specified elements
  animator.hideElements([
    "#n1text1",
    "#n1text2",
    "#n1n3",
    "#n1n3text",
    "#c6n3",
    "#c6n3text",
  ]);

  animator.addLabel("start");

  // Animate c6n3 arrow and c6n3text appearing
  animator
    .animateArrow("#c6n3", { duration: DURATION.normal })
    .show("#c6n3text", { autoAlpha: 1 });

  animator.wait(DURATION.normal);

  // Change n3term to "6" with active color
  animator
    .morphText("#n3term", "6", { duration: DURATION.instant })
    .show("#n3term", { fill: COLORS.active });

  animator.wait(DURATION.normal);

  // Animate n1n3 arrow and n1n3text appearing
  animator
    .animateArrow("#n1n3", { duration: DURATION.normal })
    .show("#n1n3text", { autoAlpha: 1 });

  animator.wait(DURATION.normal);

  // Show n1text1 and n1text2, change n1role to "F" with active color
  animator
    .show("#n1text1", { autoAlpha: 1 })
    .show("#n1text2", { autoAlpha: 1 })
    .morphText("#n1role", "F", { duration: DURATION.instant })
    .show("#n1role", { fill: COLORS.active });
};
