/**
 * Animation configuration for the Multigres Architecture Overview diagram
 * This defines the animation sequence for /img/site/req1.svg
 */

import type { SVGAnimator } from "../lib/svg-animator";
import { SVGAnimator as SVGAnimatorClass } from "../lib/svg-animator";

// Reuse constants from SVGAnimator
const COLORS = SVGAnimatorClass.COLORS;
const DURATION = SVGAnimatorClass.DURATION;

// Helper function to hide multiple elements
const hideElements = (animator: SVGAnimator, elements: string[]) => {
  elements.forEach((el) => animator.set(el, { autoAlpha: 0 }));
  return animator;
};

// Helper to update description text
const updateDescriptions = (
  animator: SVGAnimator,
  descriptions: { [key: string]: string },
  activeColor = COLORS.active,
) => {
  Object.entries(descriptions).forEach(([id, text]) => {
    if (text) {
      animator
        .show(id, { fill: activeColor })
        .morphText(id, text, { duration: DURATION.instant });
    } else {
      animator.morphText(id, "", { duration: DURATION.instant });
    }
  });
  return animator;
};

// Helper to clear all descriptions
const clearDescriptions = (animator: SVGAnimator) => {
  return updateDescriptions(animator, {
    "#desc1": "",
    "#desc2": "",
    "#desc3": "",
    "#desc4": "",
    "#desc5": "",
  });
};

// Helper to send message to multiple nodes
const sendToFollowers = (
  animator: SVGAnimator,
  message: string,
  nodes: string[] = ["#n1n2", "#n1n3", "#n1n4"],
) => {
  animator.group((a: SVGAnimator) => {
    nodes.forEach((node) => {
      a.morphText(`${node}text`, message, { duration: DURATION.instant })
        .show(`${node}text`, { autoAlpha: 1 })
        .animateArrow(node, { duration: DURATION.normal });
    });
  });
  return animator;
};

// Helper to acknowledge from nodes
const acknowledgeFrom = (
  animator: SVGAnimator,
  message: string,
  nodes: string[] = ["#n2n1", "#n4n1"],
) => {
  animator.group((a: SVGAnimator) => {
    nodes.forEach((node) => {
      a.morphText(`${node}text`, message, { duration: DURATION.instant })
        .show(node, { stroke: COLORS.active })
        .show(`${node}text`, { autoAlpha: 1, fill: COLORS.active })
        .animateArrow(node, { duration: DURATION.normal });
    });
  });
  return animator;
};

// Helper to reset colors for elements
const resetColors = (
  animator: SVGAnimator,
  elements: string[],
  type: "fill" | "stroke" = "fill",
) => {
  elements.forEach((el) => {
    animator.show(el, { [type]: COLORS.inactive });
  });
  return animator;
};

// Helper to hide and unanimate arrows
const hideArrows = (animator: SVGAnimator, arrows: string[]) => {
  arrows.forEach((arrow) => {
    animator
      .show(`${arrow}text`, { autoAlpha: 0 })
      .unanimateArrow(arrow, { duration: DURATION.instant });
  });
  return animator;
};

export const requestProcessing = (animator: SVGAnimator) => {
  // Initial setup - hide all dynamic elements
  const elementsToHide = [
    "#appa",
    "#appatext",
    "#n1a",
    "#aapp",
    "#aapptext",
    "#appb",
    "#appbtext",
    "#bapp",
    "#bapptext",
    "#n1b",
    "#n1n2",
    "#n1n2text",
    "#n1n3",
    "#n1n3text",
    "#n1n4",
    "#n1n4text",
    "#n2n1",
    "#n2n1text",
    "#n3n1",
    "#n3n1text",
    "#n4n1",
    "#n4n1text",
    "#n2a",
    "#n2b",
    "#n3a",
    "#n3b",
    "#n4a",
    "#n4b",
    "#n1o",
    "#n1otext",
  ];
  hideElements(animator, elementsToHide);

  animator
    // === Step 1: Request A ===
    // Step 1a: App issues request A
    .animateArrow("#appa", { duration: DURATION.normal })
    .show("#appatext", { autoAlpha: 1 });

  updateDescriptions(animator, { "#desc1": "* App issues request A" });
  animator.addLabel("step1a");

  // Step 1b: N1 saves A to log
  animator.show("#n1a", { autoAlpha: 1, fill: COLORS.active });
  updateDescriptions(animator, {
    "#desc2": "* N1 saves A to log",
  });
  animator.show("#desc1", { fill: COLORS.inactive }).addLabel("step1b");

  // Step 1c: N1 sends A to all followers
  sendToFollowers(animator, "A");
  updateDescriptions(animator, {
    "#desc3": "* N1 sends A to all followers",
  });
  animator.show("#desc2", { fill: COLORS.inactive }).addLabel("step1c");

  // Step 1: Followers save A to their logs
  animator
    .show("#n2a", { autoAlpha: 1, fill: COLORS.active })
    .show("#n3a", { autoAlpha: 1, fill: COLORS.active })
    .show("#n4a", { autoAlpha: 1, fill: COLORS.active });

  updateDescriptions(animator, {
    "#desc4": "* Followers save A to their logs",
  });
  animator.show("#desc3", { fill: COLORS.inactive }).addLabel("step1");

  // Reset for step 2
  hideArrows(animator, ["#n1n2", "#n1n3", "#n1n4"]);
  resetColors(animator, ["#n1a", "#n2a", "#n3a", "#n4a"], "fill");
  animator
    .show("#appa", { stroke: COLORS.inactive })
    .show("#appatext", { fill: COLORS.inactive });
  clearDescriptions(animator);
  animator.addLabel("step2a");

  // === Step 2: Acknowledge A ===
  // Step 2b: N2 and N4 ack A
  acknowledgeFrom(animator, "Ack A");
  updateDescriptions(animator, {
    "#desc1": "* N2 and N4 ack A",
    "#desc2": "* N3 ack is delayed",
  });
  animator.addLabel("step2b");

  // Step 2: N1 records A as acked for N2
  animator
    .show("#n2ack", { fill: COLORS.active })
    .morphText("#n2ack", "N2: A", { duration: DURATION.instant });

  updateDescriptions(animator, {
    "#desc3": "* N1 records A as acked for N2",
    "#desc4": "* Ack for N4 ignored",
    "#desc5": "* Durability requirements not met",
  });
  animator
    .show("#desc1", { fill: COLORS.inactive })
    .show("#desc2", { fill: COLORS.inactive })
    .addLabel("step2");

  // Reset for step 3
  animator
    .show("#n2n1text", { fill: COLORS.inactive })
    .show("#n4n1text", { fill: COLORS.inactive })
    .show("#n2ack", { fill: COLORS.inactive });
  clearDescriptions(animator);
  hideArrows(animator, ["#n2n1", "#n4n1"]);
  animator.addLabel("step3a");

  // === Step 3: Request B ===
  // Step 3b: App issues request B
  animator
    .show("#n2ack", { fill: COLORS.inactive })
    .animateArrow("#appb", { duration: DURATION.normal })
    .show("#appbtext", { autoAlpha: 1 });

  updateDescriptions(animator, { "#desc1": "* App issues request B" });
  animator.addLabel("step3b");

  // Step 3c: N1 appends B to log
  animator.show("#n1b", { autoAlpha: 1 });
  updateDescriptions(animator, {
    "#desc2": "* N1 appends B to log",
  });
  animator.show("#desc1", { fill: COLORS.inactive }).addLabel("step3c");

  // Step 3d: N1 sends B to all followers
  sendToFollowers(animator, "B");
  updateDescriptions(animator, {
    "#desc3": "* N1 sends B to all followers",
  });
  animator.show("#desc2", { fill: COLORS.inactive }).addLabel("step3d");

  // Step 3: Followers append B to their logs
  animator
    .show("#n2b", { autoAlpha: 1 })
    .show("#n3b", { autoAlpha: 1 })
    .show("#n4b", { autoAlpha: 1 });

  updateDescriptions(animator, {
    "#desc4": "* Followers append B to their logs",
    "#desc5": "* A is still not applied",
  });
  animator.show("#desc3", { fill: COLORS.inactive }).addLabel("step3");

  // === Step 4: Acknowledge B and delayed A ===
  // Step 4a: N2 and N4 ack B
  hideArrows(animator, ["#n1n2", "#n1n3", "#n1n4"]);
  acknowledgeFrom(animator, "Ack B");
  clearDescriptions(animator);
  updateDescriptions(animator, { "#desc1": "* N2 and N4 ack B" });
  animator.addLabel("step4a");

  // Step 4b: N1 records B as acked for N2
  animator
    .show("#n2ack", { fill: COLORS.active })
    .morphText("#n2ack", "N2: B", { duration: DURATION.instant });

  updateDescriptions(animator, {
    "#desc2": "* N1 records B as acked for N2",
  });
  animator.show("#desc1", { fill: COLORS.inactive }).addLabel("step4b");

  // Step 4c: N3 acks A (delayed)
  animator
    .show("#n3n1", { stroke: COLORS.active })
    .morphText("#n3n1text", "Ack A", { duration: DURATION.instant })
    .animateArrow("#n3n1", { duration: DURATION.normal })
    .show("#n3n1text", { autoAlpha: 1, fill: COLORS.active });

  updateDescriptions(animator, {
    "#desc3": "* N3 acks A (delayed)",
  });
  animator.show("#desc2", { fill: COLORS.inactive }).addLabel("step4c");

  // Step 4: A meets durability criteria
  animator
    .show("#n3ack", { fill: COLORS.active })
    .morphText("#n3ack", "N3: A", { duration: DURATION.instant });

  updateDescriptions(animator, {
    "#desc4": "* N1 records A as acked for N3.",
    "#desc5": "  A meets durability criteria",
  });
  animator.show("#desc3", { fill: COLORS.inactive }).addLabel("step4");

  // Reset for step 5
  animator
    .unanimateArrow("#n2n1", { duration: DURATION.instant })
    .unanimateArrow("#n3n1", { duration: DURATION.instant })
    .unanimateArrow("#n4n1", { duration: DURATION.instant })
    .show("#n2n1text", { autoAlpha: 0 })
    .show("#n3n1text", { autoAlpha: 0 })
    .show("#n4n1text", { autoAlpha: 0 });

  resetColors(animator, ["#n1b", "#n2b", "#n3b", "#n4b"], "fill");
  clearDescriptions(animator);
  animator
    .show("#appb", { stroke: COLORS.inactive })
    .show("#appbtext", { fill: COLORS.inactive })
    .show("#n2ack", { fill: COLORS.inactive })
    .show("#n3ack", { fill: COLORS.inactive })
    .addLabel("step5a");

  // === Step 5: Apply A ===
  // Step 5b: N1 applies A
  animator.group((a: SVGAnimator) => {
    a.show("#n1applied", { stroke: COLORS.active })
      .show("#n1appliedtext", { fill: COLORS.active })
      .moveTo(
        "#n1applied",
        null,
        { x: 40, y: 0 },
        { duration: DURATION.normal },
      )
      .moveTo(
        "#n1appliedtext",
        null,
        { x: 40, y: 0 },
        { duration: DURATION.normal },
      );
  });

  updateDescriptions(animator, {
    "#desc1": "* N1 applies A",
  });
  animator.addLabel("step5b");

  // Step 5c: N1 Acks A to App
  animator.group((a: SVGAnimator) => {
    a.show("#appa", { autoAlpha: 0 })
      .show("#appatext", { autoAlpha: 0 })
      .animateArrow("#aapp", { duration: DURATION.normal })
      .show("#aapptext", { autoAlpha: 1 });
  });
  animator.show("#desc1", { fill: COLORS.inactive });
  updateDescriptions(animator, {
    "#desc2": "* N1 Acks A to App",
  });
  animator.addLabel("step5c");

  // Step 5d: N1 sends Apply A to followers and observers
  sendToFollowers(animator, "Apply A", ["#n1n2", "#n1n3", "#n1n4", "#n1o"]);
  animator.show("#desc2", { fill: COLORS.inactive });
  updateDescriptions(animator, {
    "#desc3": "* N1 sends Apply A to followers",
    "#desc4": "  and observers",
  });
  animator.addLabel("step5d");

  // Step 5: Followers and observers apply A
  animator.group((a: SVGAnimator) => {
    a.show("#n4applied", { stroke: COLORS.active })
      .show("#n4appliedtext", { fill: COLORS.active })
      .moveTo(
        "#n4applied",
        null,
        { x: 40, y: 0 },
        { duration: DURATION.normal },
      )
      .moveTo(
        "#n4appliedtext",
        null,
        { x: 40, y: 0 },
        { duration: DURATION.normal },
      );
  });
  animator
    .show("#desc3", { fill: COLORS.inactive })
    .show("#desc4", { fill: COLORS.inactive });
  updateDescriptions(animator, {
    "#desc5": "* Followers and observers apply A",
  });
  animator.addLabel("step5");

  // Reset for step 6
  hideArrows(animator, ["#n1n2", "#n1n3", "#n1n4", "#n1o"]);
  animator
    .unanimateArrow("#aapp", { duration: DURATION.instant })
    .show("#aapptext", { autoAlpha: 0 })
    .show("#n1applied", { stroke: COLORS.inactive })
    .show("#n1appliedtext", { fill: COLORS.inactive })
    .show("#n4applied", { stroke: COLORS.inactive })
    .show("#n4appliedtext", { fill: COLORS.inactive })
    .addLabel("step6a");

  // === Step 6 & 7: Apply B ===
  // Step 6b: N3 acks B (delayed)
  clearDescriptions(animator);
  animator
    .show("#n3n1", { stroke: COLORS.active })
    .morphText("#n3n1text", "Ack B", { duration: DURATION.instant })
    .animateArrow("#n3n1", { duration: DURATION.normal })
    .show("#n3n1text", { autoAlpha: 1, fill: COLORS.active });

  updateDescriptions(animator, {
    "#desc1": "* N3 acks B (delayed)",
  });
  animator.addLabel("step6b");

  // Step 6c: N1 records B as acked for N3
  animator
    .show("#n3ack", { fill: COLORS.active })
    .morphText("#n3ack", "N3: B", { duration: DURATION.instant });
  animator.show("#desc1", { fill: COLORS.inactive });
  updateDescriptions(animator, {
    "#desc2": "* N1 recods B as acked for N3",
  });
  animator.addLabel("step6c");

  // Step 7: N1 applies B and sends to all
  animator
    .show("#n3n1text", { autoAlpha: 0 })
    .unanimateArrow("#n3n1", { duration: DURATION.instant })
    .show("#n3ack", { fill: COLORS.inactive });

  animator.group((a: SVGAnimator) => {
    a.show("#n1applied", { stroke: COLORS.active })
      .show("#n1appliedtext", { fill: COLORS.active })
      .moveTo(
        "#n1applied",
        null,
        { x: 80, y: 0 },
        { duration: DURATION.normal },
      )
      .moveTo(
        "#n1appliedtext",
        null,
        { x: 80, y: 0 },
        { duration: DURATION.normal },
      );
  });

  animator
    .unanimateArrow("#appb", { duration: DURATION.instant })
    .show("#appbtext", { autoAlpha: 0 })
    .animateArrow("#bapp", { duration: DURATION.normal })
    .show("#bapptext", { autoAlpha: 1, fill: COLORS.active });

  sendToFollowers(animator, "Apply B", ["#n1n2", "#n1n3", "#n1n4", "#n1o"]);

  animator.group((a: SVGAnimator) => {
    a.show("#n4applied", { stroke: COLORS.active })
      .show("#n4appliedtext", { fill: COLORS.active })
      .moveTo(
        "#n4applied",
        null,
        { x: 80, y: 0 },
        { duration: DURATION.normal },
      )
      .moveTo(
        "#n4appliedtext",
        null,
        { x: 80, y: 0 },
        { duration: DURATION.normal },
      );
  });

  animator.show("#desc2", { fill: COLORS.inactive });
  updateDescriptions(animator, {
    "#desc3": "* N1 performs all apply steps",
    "#desc4": "  for B as it did for A",
    "#desc5": "",
  });

  animator.addLabel("step7");
};
