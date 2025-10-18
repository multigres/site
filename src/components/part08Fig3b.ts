/**
 * Animation configuration for Part 8 Figure 3b - Ruleset change scenario 2
 * C7 recruits N2 and discovers timelines have not progressed
 */

import { SVGAnimator } from "../lib/svg-animator";

const COLORS = SVGAnimator.COLORS;
const DURATION = SVGAnimator.DURATION;

/**
 * Animation sequence for part08-fig3.svg - Scenario 2
 * Shows C7 recruiting N2, discovering no progress,
 * and propagating using combined ruleset
 */
export const part08Fig3b = (animator: SVGAnimator) => {
  // Hide elements that will be animated in this scenario
  animator.hideElements([
    "#cn1",
    "#cn1text",
    "#cn2",
    "#cn2text",
    "#cn3",
    "#cn3text",
    "#desc1",
    "#desc2",
    "#desc3",
    "#desc4",
    "#desc5",
    "#n1applied",
    "#n1t3",
    "#n1t4",
    "#n1v3",
    "#n1v4",
    "#n2applied",
    "#n2t3",
    "#n2t4",
    "#n2v3",
    "#n2v4",
    "#n3applied",
    "#n3t3",
    "#n3t4",
    "#n3v2hi",
    "#n3v3",
    "#n3v4",
  ]);

  // Initial state: Start from ending state of fig3a (but with arrows hidden)
  // Show elements that were visible at end of fig3a
  animator
    .show("#n1t2", { autoAlpha: 1, fill: COLORS.orange })
    .morphText("#n1t2", "6", { duration: 0 })
    .show("#n1v2", { autoAlpha: 1, fill: COLORS.orange })
    .morphText("#n1v2", "rs2", { duration: 0 })
    .show("#n2t2", { autoAlpha: 1, fill: COLORS.orange })
    .morphText("#n2t2", "6", { duration: 0 })
    .show("#n2v2", { autoAlpha: 1, fill: COLORS.orange })
    .morphText("#n2v2", "rs2", { duration: 0 })
    .show("#n3t2", { autoAlpha: 1, fill: COLORS.orange })
    .morphText("#n3t2", "6", { duration: 0 })
    .show("#n3v2", { autoAlpha: 1, fill: COLORS.orange })
    .morphText("#n3v2", "rs2", { duration: 0 })
    .show("#c", { stroke: COLORS.orange })
    .show("#ctext", { fill: COLORS.orange });

  // Step 1: C6 promotes N1 as leader
  animator
    .show("#cn1", { stroke: COLORS.orange })
    .animateArrow("#cn1", { duration: DURATION.normal })
    .morphText("#cn1text", "Promote", { duration: DURATION.instant })
    .show("#cn1text", { autoAlpha: 1, fill: COLORS.orange })
    .morphText("#desc1", "* C6 promotes N1 as leader", {
      duration: DURATION.instant,
    })
    .show("#desc1", { autoAlpha: 1, fill: COLORS.orange })
    .show("#n3applied", { autoAlpha: 1 })
    .wait(DURATION.pause);

  animator.addLabel("step1");

  // Step 2: N1 and N2 apply 5-a and 6-rs2
  animator
    .unanimateArrow("#cn1", { duration: DURATION.instant })
    .show("#cn1text", { autoAlpha: 0 })
    .show("#desc1", { fill: COLORS.inactive })
    .show("#n1applied", { autoAlpha: 1, stroke: COLORS.orange })
    .show("#n2applied", { autoAlpha: 1, stroke: COLORS.orange });

  animator.group(() => {
    animator.moveTo(
      "#n1applied",
      null,
      { x: 80, y: 0 },
      { duration: DURATION.normal },
    );
    animator.moveTo(
      "#n2applied",
      null,
      { x: 80, y: 0 },
      { duration: DURATION.normal },
    );
  });

  animator
    .morphText("#n1rule", "rs2", { duration: DURATION.instant })
    .show("#n1rule", { fill: COLORS.orange })
    .morphText("#n2rule", "rs2", { duration: DURATION.instant })
    .show("#n2rule", { fill: COLORS.orange });

  animator
    .morphText("#desc2", "* N1 and N2 apply 5-a and 6-rs2", {
      duration: DURATION.instant,
    })
    .show("#desc2", { autoAlpha: 1, fill: COLORS.orange });

  animator.addLabel("step2");

  // Step 3: N1 accepts request 6-B, propagates to N2 and applies it
  animator
    .show("#desc2", { fill: COLORS.inactive })
    .show("#n1t3", { autoAlpha: 1, fill: COLORS.orange })
    .morphText("#n1t3", "6", { duration: DURATION.instant })
    .show("#n1v3", { autoAlpha: 1, fill: COLORS.orange })
    .morphText("#n1v3", "B", { duration: DURATION.instant })
    .show("#n2t3", { autoAlpha: 1, fill: COLORS.orange })
    .morphText("#n2t3", "6", { duration: DURATION.instant })
    .show("#n2v3", { autoAlpha: 1, fill: COLORS.orange })
    .morphText("#n2v3", "B", { duration: DURATION.instant });

  animator.group(() => {
    animator.moveTo(
      "#n1applied",
      null,
      { x: 120, y: 0 },
      { duration: DURATION.normal },
    );
    animator.moveTo(
      "#n2applied",
      null,
      { x: 120, y: 0 },
      { duration: DURATION.normal },
    );
  });

  animator
    .morphText("#desc3", "* N1 accepts request 6-B,", {
      duration: DURATION.instant,
    })
    .show("#desc3", { autoAlpha: 1, fill: COLORS.orange })
    .morphText("#desc4", "  propagates to N2", {
      duration: DURATION.instant,
    })
    .show("#desc4", { autoAlpha: 1, fill: COLORS.orange });

  animator.addLabel("step3");
};
