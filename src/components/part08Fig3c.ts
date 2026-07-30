/**
 * Animation configuration for Part 8 Figure 3c - Ruleset change scenario 3
 * Starting from ending state of fig3b
 */

import { SVGAnimator } from "../lib/svg-animator";

const COLORS = SVGAnimator.COLORS;
const DURATION = SVGAnimator.DURATION;

/**
 * Animation sequence for part08-fig3.svg - Scenario 3
 * Shows propagation using combined ruleset
 */
export const part08Fig3c = (animator: SVGAnimator) => {
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

  // Initial state: Start from ending state of fig3b
  animator
    .morphText("#n1t2", "6", { duration: 0 })
    .show("#n1t2", { autoAlpha: 1, fill: COLORS.orange })
    .morphText("#n1v2", "rs2", { duration: 0 })
    .show("#n1v2", { autoAlpha: 1, fill: COLORS.orange })
    .morphText("#n2t2", "6", { duration: 0 })
    .show("#n2t2", { autoAlpha: 1, fill: COLORS.orange })
    .morphText("#n2v2", "rs2", { duration: 0 })
    .show("#n2v2", { autoAlpha: 1, fill: COLORS.orange })
    .morphText("#n3t2", "6", { duration: 0 })
    .show("#n3t2", { autoAlpha: 1, fill: COLORS.orange })
    .morphText("#n3v2", "rs2", { duration: 0 })
    .show("#n3v2", { autoAlpha: 1, fill: COLORS.orange })
    .show("#n1term", { fill: COLORS.orange })
    .morphText("#n1term", "6", { duration: 0 })
    .show("#n2term", { fill: COLORS.orange })
    .morphText("#n2term", "6", { duration: 0 })
    .show("#n3term", { fill: COLORS.orange })
    .morphText("#n3term", "7", { duration: 0 })
    .show("#ctext", { fill: COLORS.blue })
    .show("#c", { stroke: COLORS.blue })
    .morphText("#ctext", "C7", { duration: 0 });

  // Step 1: C7 recruits N3
  animator
    .show("#cn3", { stroke: COLORS.blue })
    .animateArrow("#cn3", { duration: DURATION.normal })
    .morphText("#cn3text", "Recruit", { duration: DURATION.instant })
    .show("#cn3text", { autoAlpha: 1, fill: COLORS.blue })
    .morphText("#n3term", "7", { duration: DURATION.instant })
    .show("#n3term", { fill: COLORS.blue })
    .morphText("#desc1", "* C7 recruits N3", {
      duration: DURATION.instant,
    })
    .show("#desc1", { autoAlpha: 1, fill: COLORS.blue })
    .wait(DURATION.pause);

  animator.addLabel("step1");

  // Step 2: C7 discovers rs2, must recruit N2
  animator
    .show("#desc1", { fill: COLORS.inactive })
    .show("#n3v2hi", { autoAlpha: 1, stroke: COLORS.blue })
    .morphText("#desc2", "* C7 discovers rs2,", {
      duration: DURATION.instant,
    })
    .show("#desc2", { autoAlpha: 1, fill: COLORS.blue })
    .morphText("#desc3", "  must recruit N2", {
      duration: DURATION.instant,
    })
    .show("#desc3", { autoAlpha: 1, fill: COLORS.blue })
    .wait(DURATION.pause);

  animator.addLabel("step2");

  // Step 3: C7 recruits N2, discovers timeline has not progressed
  animator
    .show("#n3v2hi", { autoAlpha: 0 })
    .show("#desc2", { fill: COLORS.inactive })
    .show("#desc3", { fill: COLORS.inactive })
    .show("#cn2", { stroke: COLORS.blue })
    .animateArrow("#cn2", { duration: DURATION.normal })
    .morphText("#cn2text", "Recruit", { duration: DURATION.instant })
    .show("#cn2text", { autoAlpha: 1, fill: COLORS.blue })
    .morphText("#n2term", "7", { duration: DURATION.instant })
    .show("#n2term", { fill: COLORS.blue })
    .morphText("#desc2", "* C7 recruits N2", {
      duration: DURATION.instant,
    })
    .show("#desc2", { autoAlpha: 1, fill: COLORS.blue })
    .morphText("#desc3", "* C7 discovers same timeline", {
      duration: DURATION.instant,
    })
    .show("#desc3", { autoAlpha: 1, fill: COLORS.blue })
    .wait(DURATION.pause);

  animator.addLabel("step3");

  // Step 4: C7 propagates 7-ok to all three nodes, satisfying rs1 and rs2
  animator
    .show("#desc2", { fill: COLORS.inactive })
    .show("#desc3", { fill: COLORS.inactive })
    .show("#cn1", { stroke: COLORS.blue });

  animator.group(() => {
    animator.animateArrow("#cn1", { duration: DURATION.normal });
    animator.animateArrow("#cn2", { duration: DURATION.normal });
    animator.animateArrow("#cn3", { duration: DURATION.normal });
  });

  animator
    .morphText("#cn1text", "ok", { duration: DURATION.instant })
    .show("#cn1text", { autoAlpha: 1, fill: COLORS.blue })
    .morphText("#cn2text", "ok", { duration: DURATION.instant })
    .show("#cn2text", { autoAlpha: 1, fill: COLORS.blue })
    .morphText("#cn3text", "ok", { duration: DURATION.instant })
    .show("#cn3text", { autoAlpha: 1, fill: COLORS.blue })
    .morphText("#n1term", "7", { duration: DURATION.instant })
    .show("#n1term", { fill: COLORS.blue })
    .morphText("#n1t3", "7", { duration: DURATION.instant })
    .show("#n1t3", { autoAlpha: 1, fill: COLORS.blue })
    .morphText("#n1v3", "ok", { duration: DURATION.instant })
    .show("#n1v3", { autoAlpha: 1, fill: COLORS.blue })
    .morphText("#n2t3", "7", { duration: DURATION.instant })
    .show("#n2t3", { autoAlpha: 1, fill: COLORS.blue })
    .morphText("#n2v3", "ok", { duration: DURATION.instant })
    .show("#n2v3", { autoAlpha: 1, fill: COLORS.blue })
    .morphText("#n3t3", "7", { duration: DURATION.instant })
    .show("#n3t3", { autoAlpha: 1, fill: COLORS.blue })
    .morphText("#n3v3", "ok", { duration: DURATION.instant })
    .show("#n3v3", { autoAlpha: 1, fill: COLORS.blue })
    .morphText("#desc4", "* C7 propagates 7-ok to all three", {
      duration: DURATION.instant,
    })
    .show("#desc4", { autoAlpha: 1, fill: COLORS.blue })
    .morphText("#desc5", "  nodes, satisfying rs1 and rs2", {
      duration: DURATION.instant,
    })
    .show("#desc5", { autoAlpha: 1, fill: COLORS.blue })
    .wait(DURATION.pause);

  animator.addLabel("step4");

  // Step 5: C7 promotes N1, N1/N2/N3 apply pending requests
  animator
    .show("#desc1", { autoAlpha: 0 })
    .morphText("#desc1", "", { duration: DURATION.instant })
    .show("#desc2", { autoAlpha: 0 })
    .morphText("#desc2", "", { duration: DURATION.instant })
    .show("#desc3", { autoAlpha: 0 })
    .morphText("#desc3", "", { duration: DURATION.instant })
    .show("#desc4", { autoAlpha: 0 })
    .morphText("#desc4", "", { duration: DURATION.instant })
    .show("#desc5", { autoAlpha: 0 })
    .morphText("#desc5", "", { duration: DURATION.instant })
    .unanimateArrow("#cn1", { duration: DURATION.instant })
    .unanimateArrow("#cn2", { duration: DURATION.instant })
    .unanimateArrow("#cn3", { duration: DURATION.instant })
    .show("#cn1text", { autoAlpha: 0 })
    .show("#cn2text", { autoAlpha: 0 })
    .show("#cn3text", { autoAlpha: 0 })
    .show("#cn1", { stroke: COLORS.blue })
    .animateArrow("#cn1", { duration: DURATION.normal })
    .morphText("#cn1text", "Promote", { duration: DURATION.instant })
    .show("#cn1text", { autoAlpha: 1, fill: COLORS.blue })
    .morphText("#desc1", "* C7 promotes N1", {
      duration: DURATION.instant,
    })
    .show("#desc1", { autoAlpha: 1, fill: COLORS.blue });

  animator
    .show("#n1applied", { autoAlpha: 1, stroke: COLORS.blue })
    .show("#n2applied", { autoAlpha: 1, stroke: COLORS.blue })
    .show("#n3applied", { autoAlpha: 1, stroke: COLORS.blue });

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
    animator.moveTo(
      "#n3applied",
      null,
      { x: 120, y: 0 },
      { duration: DURATION.normal },
    );
  });

  animator
    .morphText("#desc2", "* N1, N2, N3 apply pending requests", {
      duration: DURATION.instant,
    })
    .show("#desc2", { autoAlpha: 1, fill: COLORS.blue })
    .wait(DURATION.pause);

  animator.addLabel("step5");
};
