/**
 * Animation configuration for Part 8 Figure 3a - Ruleset change scenario 1
 * C7 recruits N2 and discovers a more progressed timeline
 */

import { SVGAnimator } from "../lib/svg-animator";

const COLORS = SVGAnimator.COLORS;
const DURATION = SVGAnimator.DURATION;

/**
 * Animation sequence for part08-fig3.svg - Scenario 1
 * Shows C7 recruiting N2, discovering progressed timeline,
 * and delegating leadership back to N1
 */
export const part08Fig3a = (animator: SVGAnimator) => {
  // Initial state: Hide all animated elements except c, ctext, and node rules
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
    "#n1t2",
    "#n1t3",
    "#n1t4",
    "#n1v2",
    "#n1v3",
    "#n1v4",
    "#n2applied",
    "#n2t2",
    "#n2t3",
    "#n2t4",
    "#n2v2",
    "#n2v3",
    "#n2v4",
    "#n3applied",
    "#n3t2",
    "#n3t3",
    "#n3t4",
    "#n3v2",
    "#n3v2hi",
    "#n3v3",
    "#n3v4",
  ]);

  // Step 1: C revokes N1 leadership (orange)
  animator
    .show("#c", { stroke: COLORS.orange })
    .show("#ctext", { fill: COLORS.orange })
    .show("#cn1", { stroke: COLORS.orange })
    .animateArrow("#cn1", { duration: DURATION.normal })
    .morphText("#cn1text", "Revoke", { duration: DURATION.instant })
    .show("#cn1text", { autoAlpha: 1, fill: COLORS.orange })
    .morphText("#desc1", "* C6 revokes N1's leadership", {
      duration: DURATION.instant,
    })
    .show("#desc1", { autoAlpha: 1, fill: COLORS.orange })
    .wait(DURATION.pause);

  animator.addLabel("step1");

  // Step 2: C6 appends ruleset change 6-rs2 to logs of N1, N2, N3
  animator
    .unanimateArrow("#cn1", { duration: DURATION.instant })
    .show("#desc1", { fill: COLORS.inactive })
    .show("#cn1text", { autoAlpha: 0 })
    .show("#cn2", { stroke: COLORS.orange })
    .show("#cn3", { stroke: COLORS.orange })
    .group(() => {
      animator.animateArrow("#cn1", { duration: DURATION.normal });
      animator.animateArrow("#cn2", { duration: DURATION.normal });
      animator.animateArrow("#cn3", { duration: DURATION.normal });
    })
    .morphText("#cn1text", "rs2", { duration: DURATION.instant })
    .show("#cn1text", { autoAlpha: 1, fill: COLORS.orange })
    .morphText("#cn2text", "rs2", { duration: DURATION.instant })
    .show("#cn2text", { autoAlpha: 1, fill: COLORS.orange })
    .morphText("#cn3text", "rs2", { duration: DURATION.instant })
    .show("#cn3text", { autoAlpha: 1, fill: COLORS.orange })
    .morphText("#n1t2", "6", { duration: DURATION.instant })
    .show("#n1t2", { autoAlpha: 1, fill: COLORS.orange })
    .morphText("#n1v2", "rs2", { duration: DURATION.instant })
    .show("#n1v2", { autoAlpha: 1, fill: COLORS.orange })
    .morphText("#n2t2", "6", { duration: DURATION.instant })
    .show("#n2t2", { autoAlpha: 1, fill: COLORS.orange })
    .morphText("#n2v2", "rs2", { duration: DURATION.instant })
    .show("#n2v2", { autoAlpha: 1, fill: COLORS.orange })
    .morphText("#n3t2", "6", { duration: DURATION.instant })
    .show("#n3t2", { autoAlpha: 1, fill: COLORS.orange })
    .morphText("#n3v2", "rs2", { duration: DURATION.instant })
    .show("#n3v2", { autoAlpha: 1, fill: COLORS.orange })
    .morphText("#n1term", "6", { duration: DURATION.instant })
    .show("#n1term", { fill: COLORS.orange })
    .morphText("#n2term", "6", { duration: DURATION.instant })
    .show("#n2term", { fill: COLORS.orange })
    .morphText("#n3term", "6", { duration: DURATION.instant })
    .show("#n3term", { fill: COLORS.orange })
    .morphText("#desc2", "* C6 appends 6-rs2 to N1, N2, N3", {
      duration: DURATION.instant,
    })
    .show("#desc2", { autoAlpha: 1, fill: COLORS.orange })
    .wait(DURATION.pause);

  animator.addLabel("step2");
};
