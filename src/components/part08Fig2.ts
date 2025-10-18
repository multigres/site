/**
 * Animation configuration for Part 8 Figure 2 - Ruleset change example
 * Shows a coordinator in term 6 propagating N3 to N1 and N2,
 * thereby satisfying rs1 and rs2 for N1's candidacy
 */

import { SVGAnimator } from "../lib/svg-animator";

const DURATION = SVGAnimator.DURATION;

/**
 * Animation sequence for part08-fig2.svg
 * Demonstrates ruleset change where coordinator propagates timeline
 * to satisfy both old ruleset (rs1) and new ruleset (rs2)
 */
export const part08Fig2 = (animator: SVGAnimator) => {
  // Initial state: Hide all elements found in the SVG
  animator.hideElements([
    "#n1t2",
    "#n1v2",
    "#n2n1",
    "#n2n3",
    "#n2t2",
    "#n2v2",
    "#n3v2",
  ]);

  animator.addLabel("start");

  // Step 1: Make N2 texts visible
  animator
    .wait(DURATION.fast)
    .show("#n2t2", { autoAlpha: 1 })
    .show("#n2v2", { autoAlpha: 1 });

  animator.wait(DURATION.fast);

  // Step 2: Show arrows from N2 (grouped for simultaneous animation)
  animator.group(() => {
    animator.animateArrow("#n2n1", { duration: DURATION.normal });
    animator.animateArrow("#n2n3", { duration: DURATION.normal });
  });

  animator.wait(DURATION.fast);

  // Step 3: Make N1 and N3 texts visible
  animator
    .show("#n1t2", { autoAlpha: 1 })
    .show("#n1v2", { autoAlpha: 1 })
    .show("#n3v2", { autoAlpha: 1 });
};
