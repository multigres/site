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
    .morphText("#n3term", "6", { duration: 0 })
    .show("#ctext", { fill: COLORS.orange })
    .show("#c", { stroke: COLORS.orange });

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
    .show("#n3applied", { autoAlpha: 1 });

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

  // Step 4: C7 discovers N3
  animator
    .show("#desc1", { autoAlpha: 0 })
    .morphText("#desc1", "", { duration: DURATION.instant })
    .show("#desc2", { autoAlpha: 0 })
    .morphText("#desc2", "", { duration: DURATION.instant })
    .show("#desc3", { autoAlpha: 0 })
    .morphText("#desc3", "", { duration: DURATION.instant })
    .show("#desc4", { autoAlpha: 0 })
    .morphText("#desc4", "", { duration: DURATION.instant })
    .morphText("#ctext", "", { duration: DURATION.instant })
    .show("#c", { stroke: COLORS.blue })
    .show("#ctext", { fill: COLORS.blue })
    .show("#cn3", { stroke: COLORS.blue })
    .morphText("#ctext", "C7", { duration: DURATION.normal })
    .animateArrow("#cn3", { duration: DURATION.normal })
    .morphText("#cn3text", "Recruit", { duration: DURATION.instant })
    .show("#cn3text", { autoAlpha: 1, fill: COLORS.blue })
    .morphText("#n3term", "7", { duration: DURATION.instant })
    .show("#n3term", { fill: COLORS.blue })
    .morphText("#desc1", "* C7 recruits N3", {
      duration: DURATION.instant,
    })
    .show("#desc1", { autoAlpha: 1, fill: COLORS.blue });

  animator.addLabel("step4");

  // Step 5: C7 discovers rs2, must recruit N2
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
    .show("#desc3", { autoAlpha: 1, fill: COLORS.blue });

  animator.addLabel("step5");

  // Step 6: C7 recruits N2, discovers progressed timeline
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
    .morphText("#desc4", "* C7 recruits N2,", {
      duration: DURATION.instant,
    })
    .show("#desc4", { autoAlpha: 1, fill: COLORS.blue })
    .morphText("#desc5", "  discovers progressed timeline", {
      duration: DURATION.instant,
    })
    .show("#desc5", { autoAlpha: 1, fill: COLORS.blue });

  animator.addLabel("step6");

  // Step 7: C7 promotes N1 into term 7, propagates 7-ok to all nodes
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
    .show("#cn1", { stroke: COLORS.blue })
    .unanimateArrow("#cn1", { duration: DURATION.instant })
    .unanimateArrow("#cn2", { duration: DURATION.instant })
    .unanimateArrow("#cn3", { duration: DURATION.instant })
    .show("#cn3text", { autoAlpha: 0 })
    .morphText("#cn3text", "", { duration: DURATION.instant });

  animator.group(() => {
    animator.animateArrow("#cn1", { duration: DURATION.normal });
    animator.animateArrow("#cn2", { duration: DURATION.normal });
  });

  animator
    .morphText("#cn1text", "ok", { duration: DURATION.instant })
    .show("#cn1text", { autoAlpha: 1, fill: COLORS.blue })
    .morphText("#cn2text", "ok", { duration: DURATION.instant })
    .show("#cn2text", { autoAlpha: 1, fill: COLORS.blue })
    .morphText("#n1term", "7", { duration: DURATION.instant })
    .show("#n1term", { fill: COLORS.blue })
    .morphText("#n1t4", "7", { duration: DURATION.fast })
    .show("#n1t4", { autoAlpha: 1, fill: COLORS.blue })
    .morphText("#n1v4", "ok", { duration: DURATION.fast })
    .show("#n1v4", { autoAlpha: 1, fill: COLORS.blue })
    .morphText("#n2t4", "7", { duration: DURATION.fast })
    .show("#n2t4", { autoAlpha: 1, fill: COLORS.blue })
    .morphText("#n2v4", "ok", { duration: DURATION.fast })
    .show("#n2v4", { autoAlpha: 1, fill: COLORS.blue })
    .morphText("#desc1", "* C7 appends 7-ok to N1 and N2", {
      duration: DURATION.instant,
    })
    .show("#desc1", { autoAlpha: 1, fill: COLORS.blue });

  animator.addLabel("step7");

  animator
    .unanimateArrow("#cn2", { duration: DURATION.instant })
    .show("#cn2text", { autoAlpha: 0 })
    .morphText("#cn2text", "", { duration: DURATION.instant })
    .unanimateArrow("#cn1", { duration: DURATION.instant })
    .show("#cn1text", { autoAlpha: 0 })
    .morphText("#cn1text", "", { duration: DURATION.instant })
    .animateArrow("#cn1", { duration: DURATION.normal })
    .morphText("#cn1text", "Promote", { duration: DURATION.instant })
    .show("#cn1text", { autoAlpha: 1 })
    .show("#desc1", { autoAlpha: 1, fill: COLORS.inactive })
    .morphText("#desc2", "* C7 promotes N1", {
      duration: DURATION.instant,
    })
    .show("#desc2", { autoAlpha: 1, fill: COLORS.blue });

  animator.addLabel("step8");

  animator
    .unanimateArrow("#cn1", { duration: DURATION.instant })
    .show("#cn1text", { autoAlpha: 0 })
    .morphText("#cn1text", "", { duration: DURATION.instant })
    .show("#c", { stroke: COLORS.inactive })
    .show("#ctext", { fill: COLORS.inactive })
    .show("#n1applied", { stroke: COLORS.blue })
    .show("#n2applied", { stroke: COLORS.blue });

  animator.group(() => {
    animator.moveTo(
      "#n1applied",
      null,
      { x: 160, y: 0 },
      { duration: DURATION.normal },
    );
    animator.moveTo(
      "#n2applied",
      null,
      { x: 160, y: 0 },
      { duration: DURATION.normal },
    );
  });

  animator
    .show("#desc2", { autoAlpha: 1, fill: COLORS.inactive })
    .morphText("#desc3", "* N1 and N2 apply 7-ok", {
      duration: DURATION.instant,
    })
    .show("#desc3", { autoAlpha: 1, fill: COLORS.blue });

  animator
    .morphText("#n3t3", "6", { duration: DURATION.fast })
    .show("#n3t3", { autoAlpha: 1, fill: COLORS.orange })
    .morphText("#n3v3", "B", { duration: DURATION.fast })
    .show("#n3v3", { autoAlpha: 1, fill: COLORS.orange })
    .morphText("#n3t4", "7", { duration: DURATION.fast })
    .show("#n3t4", { autoAlpha: 1, fill: COLORS.blue })
    .morphText("#n3v4", "ok", { duration: DURATION.fast })
    .show("#n3v4", { autoAlpha: 1, fill: COLORS.blue })
    .show("#n3applied", { stroke: COLORS.blue })
    .moveTo("#n3applied", null, { x: 160, y: 0 }, { duration: DURATION.normal })
    .morphText("#desc4", "* N1 propagates events to N3", {
      duration: DURATION.instant,
    })
    .show("#desc4", { autoAlpha: 1, fill: COLORS.blue });

  animator.addLabel("step9");
};
