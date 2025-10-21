/**
 * Animation configuration for Part 7 Figure 3 - Scenario 4
 */

import { SVGAnimator } from "../lib/svg-animator";

const COLORS = SVGAnimator.COLORS;
const DURATION = SVGAnimator.DURATION;

/**
 * Animation sequence for part07-fig3.svg - Scenario 4
 * Initial state matches ending state of Scenario 3
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
export const part07Fig3Scenario4 = (animator: SVGAnimator) => {
  // Initial state: Ending state of Scenario 3 (after C7 propagates to N6)
  // N1 has slots 3, 4, 5 (C, D, 7-ok), N2 has slot 3, N3 has slot 3 (6-ok),
  // N5 has slots 2 and 3 (5-B and 6-ok), N6 has slots 3, 4, 5 (C, D, 7-ok)
  animator.hideElements([
    // N1 elements (slots 3, 4, and 5 are visible initially)
    // N2 elements (slot 3 is visible initially)
    "#n2t4",
    "#n2v4",
    "#n2t5",
    "#n2v5",
    // N3 elements (slot 3 is visible - 6-ok from Scenario 2)
    "#n3t4",
    "#n3v4",
    "#n3t5",
    "#n3v5",
    // N4 elements (all hidden)
    "#n4t3",
    "#n4v3",
    "#n4t4",
    "#n4v4",
    "#n4t5",
    "#n4v5",
    // N5 elements (slots 2 and 3 are visible - 5-B and 6-ok from Scenario 2)
    "#n5t4",
    "#n5v4",
    "#n5t5",
    "#n5v5",
    // N6 elements (slots 3, 4, and 5 are visible - C, D, 7-ok from Scenario 3)
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
    // Quorums
    "#quorum1",
    "#quorum2",
    "#quorum3",
    // Descriptions
    "#desc1",
    "#desc2",
    "#desc3",
    "#desc4",
    "#desc5",
  ]);

  // Step 1: C8 recruits N3, N4 and N5
  animator
    .show("#n3", { fill: COLORS.orange })
    .show("#n4", { fill: COLORS.orange })
    .show("#n5", { fill: COLORS.orange })
    .show("#quorum1", { autoAlpha: 1, stroke: COLORS.orange })
    .morphText("#desc1", "* C8 recruits N3, N4 and N5")
    .show("#desc1", { autoAlpha: 1, fill: COLORS.orange });

  animator.addLabel("step1");

  // Step 2: N5 appends 6-ok to N4
  animator
    .morphText("#n5n4text", "Append 6-ok")
    .animateArrow("#n5n4", { duration: DURATION.normal })
    .show("#n5n4text", { autoAlpha: 1 })
    .wait(DURATION.fast)
    .show("#n4t3", { autoAlpha: 1 })
    .show("#n4v3", { autoAlpha: 1 })
    .morphText("#desc2", "* N5 appends 6-ok to N4")
    .show("#desc2", { autoAlpha: 1, fill: COLORS.orange });

  animator.addLabel("step2");

  // Step 3: N5 applies and propagates 8-ok to N3 and N4
  animator
    .wait(DURATION.fast)
    .show("#n5t4", { autoAlpha: 1 })
    .show("#n5v4", { autoAlpha: 1 })
    .unanimateArrow("#n5n4", { duration: DURATION.instant })
    .set("#n5n4text", { autoAlpha: 0 })
    .group(() => {
      animator
        .morphText("#n5n3text", "Append 8-ok")
        .animateArrow("#n5n3", { duration: DURATION.normal })
        .show("#n5n3text", { autoAlpha: 1 });
      animator
        .morphText("#n5n4text", "Append 8-ok")
        .animateArrow("#n5n4", { duration: DURATION.normal })
        .show("#n5n4text", { autoAlpha: 1 });
    })
    .wait(DURATION.fast)
    .show("#n3t4", { autoAlpha: 1 })
    .show("#n3v4", { autoAlpha: 1 })
    .show("#n4t4", { autoAlpha: 1 })
    .show("#n4v4", { autoAlpha: 1 })
    .morphText("#desc3", "* N5 appends 8-ok to itself")
    .show("#desc3", { autoAlpha: 1, fill: COLORS.orange })
    .morphText("#desc4", "  and propagates to N3 and N4")
    .show("#desc4", { autoAlpha: 1, fill: COLORS.orange });

  animator.addLabel("step3");

  // Step 4: 8-ok reaches durability but C8 crashes
  animator
    .wait(DURATION.fast)
    .morphText("#desc5", "* Durability reached, but C8 crashes")
    .show("#desc5", { autoAlpha: 1, fill: COLORS.red });

  animator.addLabel("step4");
};
