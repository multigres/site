/**
 * Animation configuration for Part 7 Figure 3 - Scenario 3
 */

import { SVGAnimator } from "../lib/svg-animator";

const COLORS = SVGAnimator.COLORS;
const DURATION = SVGAnimator.DURATION;

/**
 * Animation sequence for part07-fig3.svg - Scenario 3
 * C7 recruits N1, N4 and N6, propagates N1 to N6, then fails
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
export const part07Fig3Scenario3 = (animator: SVGAnimator) => {
  // Initial state: Ending state of Scenario 2 (after C6 crashes)
  // N1 has slots 3 and 4, N2 has slot 3, N3 has slot 3 (6-ok), N5 has slots 2 and 3 (5-B and 6-ok)
  animator.hideElements([
    // N1 elements (slots 3 and 4 are visible initially, only hide slot 5)
    "#n1t5",
    "#n1v5",
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

  // Step 1: C7 recruits N1, N4 and N6
  animator
    .show("#n1", { fill: COLORS.blue })
    .show("#n4", { fill: COLORS.blue })
    .show("#n6", { fill: COLORS.blue })
    .show("#quorum2", { autoAlpha: 1 })
    .morphText("#desc1", "* C7 recruits N1, N4 and N6")
    .show("#desc1", { autoAlpha: 1, fill: COLORS.blue });

  animator.addLabel("step1");

  // Step 2: N1 propagates C (with term 5) to N6
  animator
    .morphText("#n1n6text", "Append 5-C")
    .animateArrow("#n1n6", { duration: DURATION.normal })
    .show("#n1n6text", { autoAlpha: 1 })
    .wait(DURATION.fast)
    .show("#n6t3", { autoAlpha: 1 })
    .show("#n6v3", { autoAlpha: 1 })
    .morphText("#desc2", "* Step 2: Append 5-C")
    .show("#desc2", { autoAlpha: 1, fill: COLORS.blue });

  animator.addLabel("step2");

  // Step 3: N1 propagates D (with term 5) to N6
  animator
    .unanimateArrow("#n1n6", { duration: DURATION.instant })
    .set("#n1n6text", { autoAlpha: 0 })
    .morphText("#n1n6text", "Append 5-D")
    .animateArrow("#n1n6", { duration: DURATION.normal })
    .show("#n1n6text", { autoAlpha: 1 })
    .wait(DURATION.fast)
    .show("#n6t4", { autoAlpha: 1 })
    .show("#n6v4", { autoAlpha: 1 })
    .morphText("#desc3", "* Step 3: Append 5-D")
    .show("#desc3", { autoAlpha: 1, fill: COLORS.blue });

  animator.addLabel("step3");

  // Step 4: N1 creates new request with term 7 and replicates to N6
  animator
    .wait(DURATION.fast)
    .show("#n1t5", { autoAlpha: 1 })
    .show("#n1v5", { autoAlpha: 1 })
    .unanimateArrow("#n1n6", { duration: DURATION.instant })
    .set("#n1n6text", { autoAlpha: 0 })
    .morphText("#n1n6text", "Append 7-ok")
    .animateArrow("#n1n6", { duration: DURATION.normal })
    .show("#n1n6text", { autoAlpha: 1 })
    .wait(DURATION.fast)
    .show("#n6t5", { autoAlpha: 1 })
    .show("#n6v5", { autoAlpha: 1 })
    .morphText("#desc4", "* Step 4: Append 7-ok to N1 and transmit")
    .show("#desc4", { autoAlpha: 1, fill: COLORS.blue });

  animator.addLabel("step4");

  // Step 5: C7 crashes
  animator
    .morphText("#desc5", "* C7 crashes")
    .show("#desc5", { autoAlpha: 1, fill: COLORS.red });

  animator.addLabel("step5");
};
