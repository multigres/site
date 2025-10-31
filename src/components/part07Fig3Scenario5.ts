/**
 * Animation configuration for Part 7 Figure 3 - Scenario 5
 */

import { SVGAnimator } from "../lib/svg-animator";

const COLORS = SVGAnimator.COLORS;
const DURATION = SVGAnimator.DURATION;

/**
 * Animation sequence for part07-fig3.svg - Scenario 5
 * Initial state matches ending state of Scenario 4
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
export const part07Fig3Scenario5 = (animator: SVGAnimator) => {
  // Initial state: Ending state of Scenario 4 (after C8 crashes with 8-ok durable)
  // N1 has slots 3, 4, 5 (C, D, 7-ok), N2 has slot 3 (C),
  // N3 has slots 3, 4 (6-ok, 8-ok), N4 has slots 3, 4 (6-ok, 8-ok),
  // N5 has slots 2, 3, 4 (5-B, 6-ok, 8-ok), N6 has slots 3, 4, 5 (C, D, 7-ok)
  animator.hideElements([
    // N1 elements (slots 3, 4, and 5 are visible initially)
    // N2 elements (slot 3 is visible initially)
    "#n2t4",
    "#n2v4",
    "#n2t5",
    "#n2v5",
    // N3 elements (slots 3 and 4 are visible - 6-ok and 8-ok from Scenario 4)
    "#n3t5",
    "#n3v5",
    // N4 elements (slots 3 and 4 are visible - 6-ok and 8-ok from Scenario 4)
    "#n4t5",
    "#n4v5",
    // N5 elements (slots 2, 3, and 4 are visible - 5-B, 6-ok, 8-ok from Scenario 4)
    "#n5t5",
    "#n5v5",
    // N6 elements (slots 3, 4, and 5 are visible - C, D, 7-ok from Scenario 4)
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

  // Step 1: C9 discovers all nodes
  animator
    .show("#n1", { fill: COLORS.purple })
    .show("#n2", { fill: COLORS.purple })
    .show("#n3", { fill: COLORS.purple })
    .show("#n4", { fill: COLORS.purple })
    .show("#n5", { fill: COLORS.purple })
    .show("#n6", { fill: COLORS.purple })
    .show("#quorum3", { autoAlpha: 1 })
    .morphText("#desc1", "* C9 discovers all nodes")
    .show("#desc1", { autoAlpha: 1, fill: COLORS.purple, attr: { dx: -90, dy: -120 } });

  animator.addLabel("step1");

  // Step 2: N1 appends 6-ok to N1, N2 and N6
  animator
    .group(() => {
      animator
        .morphText("#n4n1text", "Append 6-ok")
        .animateArrow("#n4n1", { duration: DURATION.normal })
        .morphText("#n4n2text", "Append 6-ok")
        .animateArrow("#n4n2", { duration: DURATION.normal })
        .morphText("#n4n6text", "Append 6-ok")
        .animateArrow("#n4n6", { duration: DURATION.normal });
    })
    .show("#n4n1text", { autoAlpha: 1 })
    .show("#n4n2text", { autoAlpha: 1 })
    .show("#n4n6text", { autoAlpha: 1 })
    .changeText("#n1t3", "", COLORS.active, DURATION.instant)
    .changeText("#n1v3", "", COLORS.active, DURATION.instant)
    .changeText("#n1t4", "", COLORS.active, DURATION.instant)
    .changeText("#n1v4", "", COLORS.active, DURATION.instant)
    .changeText("#n1t5", "", COLORS.active, DURATION.instant)
    .changeText("#n1v5", "", COLORS.active, DURATION.instant)
    .changeText("#n2t3", "", COLORS.active, DURATION.instant)
    .changeText("#n2v3", "", COLORS.active, DURATION.instant)
    .changeText("#n6t3", "", COLORS.active, DURATION.instant)
    .changeText("#n6v3", "", COLORS.active, DURATION.instant)
    .changeText("#n6t4", "", COLORS.active, DURATION.instant)
    .changeText("#n6v4", "", COLORS.active, DURATION.instant)
    .changeText("#n6t5", "", COLORS.active, DURATION.instant)
    .changeText("#n6v5", "", COLORS.active, DURATION.instant)
    .group(() => {
      animator
        .changeText("#n1t3", "6", COLORS.active, DURATION.fast)
        .changeText("#n1v3", "ok", COLORS.active, DURATION.fast)
        .changeText("#n2t3", "6", COLORS.active, DURATION.fast)
        .changeText("#n2v3", "ok", COLORS.active, DURATION.fast)
        .changeText("#n6t3", "6", COLORS.active, DURATION.fast)
        .changeText("#n6v3", "ok", COLORS.active, DURATION.fast);
    })
    .morphText("#desc2", "* N4 appends 6-ok to N1, N2 and N6")
    .show("#desc2", { autoAlpha: 1, fill: COLORS.purple, attr: { dx: -90, dy: -120 } })
    .morphText("#desc3", "  truncating logs as needed")
    .show("#desc3", { autoAlpha: 1, fill: COLORS.purple, attr: { dx: -90, dy: -120 } });

  animator.addLabel("step2");

  // Step 3: N1 appends 8-ok to N1, N2 and N6
  animator
    .unanimateArrow("#n4n1", { duration: DURATION.instant })
    .unanimateArrow("#n4n2", { duration: DURATION.instant })
    .unanimateArrow("#n4n6", { duration: DURATION.instant })
    .group(() => {
      animator
        .morphText("#n4n1text", "Append 8-ok")
        .animateArrow("#n4n1", { duration: DURATION.normal })
        .morphText("#n4n2text", "Append 8-ok")
        .animateArrow("#n4n2", { duration: DURATION.normal })
        .morphText("#n4n6text", "Append 8-ok")
        .animateArrow("#n4n6", { duration: DURATION.normal });
    })
    .show("#n4n1text", { autoAlpha: 1 })
    .show("#n4n2text", { autoAlpha: 1 })
    .show("#n4n6text", { autoAlpha: 1 })
    .group(() => {
      animator
        .changeText("#n1t4", "8", COLORS.orange, DURATION.fast)
        .changeText("#n1v4", "ok", COLORS.orange, DURATION.fast)
        .changeText("#n2t4", "8", COLORS.orange, DURATION.fast)
        .show("#n2t4", { autoAlpha: 1 })
        .changeText("#n2v4", "ok", COLORS.orange, DURATION.fast)
        .show("#n2v4", { autoAlpha: 1 })
        .changeText("#n6t4", "8", COLORS.orange, DURATION.fast)
        .changeText("#n6v4", "ok", COLORS.orange, DURATION.fast);
    })
    .morphText("#desc4", "* N4 appends 8-ok to N1, N2 and N6")
    .show("#desc4", { autoAlpha: 1, fill: COLORS.purple, attr: { dx: -90, dy: -120 } });

  animator.addLabel("step3");

  // Step 3: N4 appends 9-ok to itself and transmits to all
  animator
    .wait(DURATION.fast)
    .show("#n4t5", { autoAlpha: 1 })
    .show("#n4v5", { autoAlpha: 1 })
    .unanimateArrow("#n4n1", { duration: DURATION.instant })
    .set("#n4n1text", { autoAlpha: 0 })
    .unanimateArrow("#n4n2", { duration: DURATION.instant })
    .set("#n4n2text", { autoAlpha: 0 })
    .unanimateArrow("#n4n5", { duration: DURATION.instant })
    .set("#n4n5text", { autoAlpha: 0 })
    .unanimateArrow("#n4n6", { duration: DURATION.instant })
    .set("#n4n6text", { autoAlpha: 0 })
    .group(() => {
      animator
        .morphText("#n4n1text", "Append 9-ok")
        .animateArrow("#n4n1", { duration: DURATION.normal })
        .show("#n4n1text", { autoAlpha: 1 });
      animator
        .morphText("#n4n2text", "Append 9-ok")
        .animateArrow("#n4n2", { duration: DURATION.normal })
        .show("#n4n2text", { autoAlpha: 1 });
      animator
        .morphText("#n4n3text", "Append 9-ok")
        .animateArrow("#n4n3", { duration: DURATION.normal })
        .show("#n4n3text", { autoAlpha: 1 });
      animator
        .morphText("#n4n5text", "Append 9-ok")
        .animateArrow("#n4n5", { duration: DURATION.normal })
        .show("#n4n5text", { autoAlpha: 1 });
      animator
        .morphText("#n4n6text", "Append 9-ok")
        .animateArrow("#n4n6", { duration: DURATION.normal })
        .show("#n4n6text", { autoAlpha: 1 });
    })
    .wait(DURATION.fast)
    .changeText("#n1t5", "9", COLORS.purple, DURATION.instant)
    .changeText("#n1v5", "ok", COLORS.purple, DURATION.instant)
    .show("#n2t5", { autoAlpha: 1 })
    .show("#n2v5", { autoAlpha: 1 })
    .show("#n3t5", { autoAlpha: 1 })
    .show("#n3v5", { autoAlpha: 1 })
    .show("#n5t5", { autoAlpha: 1 })
    .show("#n5v5", { autoAlpha: 1 })
    .changeText("#n6t5", "9", COLORS.purple, DURATION.instant)
    .changeText("#n6v5", "ok", COLORS.purple, DURATION.instant)
    .morphText("#desc5", "* N4 appends 9-ok to itself and transmits")
    .show("#desc5", { autoAlpha: 1, fill: COLORS.purple, attr: { dx: -90, dy: -120 } });

  animator.addLabel("step4");
};
