/**
 * Animation configuration for Part 6 Figure 3 - All possible leaders (NEW VERSION)
 */

import { SVGAnimator } from "../lib/svg-animator";

const DURATION = SVGAnimator.DURATION;

// Relative offsets for moving elements between sections
// Revocation (top-left) -> Target (right): move right and down
// Calculated from: n1 source (50, 112.738) -> target worked at (825, 435)
// Relative offset: (825-50, 435-112.738) = (775, 322.262)
const REVOCATION_TO_TARGET_OFFSET = {
  x: 775,
  y: 322.262,
} as const;

// Candidacy (bottom-left) -> Target (right): move right and UP
// Calculated from: n4n6 source (338.934, 1233.763) -> target works at (1113.934, 813.763)
// Relative offset: (775, -420)
const CANDIDACY_TO_TARGET_OFFSET = {
  x: 775, // Same horizontal movement as Revocation->Target
  y: -420, // Move up (negative) to reach Target section
} as const;

// Helper function to calculate target position from source + offset
const addOffset = (
  source: { x: number; y: number },
  offset: { x: number; y: number },
) => ({
  x: source.x + offset.x,
  y: source.y + offset.y,
});

// Helper function to extract position from SVG element's transform attribute
const getElementPosition = (selector: string): { x: number; y: number } => {
  const element = document.querySelector(selector);
  if (!element) {
    console.warn(`Element not found: ${selector}`);
    return { x: 0, y: 0 };
  }

  const transform = element.getAttribute("transform");
  if (!transform) {
    return { x: 0, y: 0 };
  }

  // Extract translate(x, y) from transform attribute
  const translateMatch = transform.match(/translate\(([^,\s]+)[\s,]+([^)]+)\)/);
  if (translateMatch) {
    return {
      x: parseFloat(translateMatch[1]),
      y: parseFloat(translateMatch[2]),
    };
  }

  return { x: 0, y: 0 };
};

/**
 * Animation sequence for part06-fig3.svg - All possible leaders (NEW VERSION)
 */
export const part06Fig3 = (animator: SVGAnimator) => {
  // Initial state: Hide elements
  animator.hideElements(["#blue", "#purple", "#green"]);

  // Step 1: Move elements from Revocation and Candidacy to Target section

  // Get source positions from SVG
  const n1Source = getElementPosition("#n1");
  const n4Source = getElementPosition("#n4");
  const n4n6Source = getElementPosition("#n4n6");

  // Move n1 from Revocation to Target using relative offset
  animator.moveTo(
    "#n1",
    null,
    addOffset(n1Source, REVOCATION_TO_TARGET_OFFSET),
    {
      duration: DURATION.slow,
      ease: "power2.inOut",
    },
  );

  // Move n4 from Revocation to Target using relative offset
  animator.moveTo(
    "#n4",
    null,
    addOffset(n4Source, REVOCATION_TO_TARGET_OFFSET),
    {
      duration: DURATION.slow,
      ease: "power2.inOut",
    },
  );

  // Move n4n6 from Candidacy to Target using Candidacy-specific offset
  animator.moveTo(
    "#n4n6",
    null,
    addOffset(n4n6Source, CANDIDACY_TO_TARGET_OFFSET),
    {
      duration: DURATION.slow,
      ease: "power2.inOut",
    },
  );

  // Show blue text/label
  animator.show("#blue", { autoAlpha: 1 });

  animator.addLabel("step1");

  // Step 2: Restore step1 elements and move new set of elements to Target

  // First, quickly restore step1 elements to their original positions
  animator.group((a: SVGAnimator) => {
    a.moveTo("#n1", null, n1Source, { duration: DURATION.fast });
    a.moveTo("#n4", null, n4Source, { duration: DURATION.fast });
    a.moveTo("#n4n6", null, n4n6Source, { duration: DURATION.fast });
  });

  // Get source positions from SVG for step2 elements
  const n3Source = getElementPosition("#n3");
  const n4n5Source = getElementPosition("#n4n5");

  // Move n3 from Revocation to Target
  animator.moveTo(
    "#n3",
    null,
    addOffset(n3Source, REVOCATION_TO_TARGET_OFFSET),
    {
      duration: DURATION.slow,
      ease: "power2.inOut",
    },
  );

  // Move n4 from Revocation to Target (same as step1)
  animator.moveTo(
    "#n4",
    null,
    addOffset(n4Source, REVOCATION_TO_TARGET_OFFSET),
    {
      duration: DURATION.slow,
      ease: "power2.inOut",
    },
  );

  // Move n4n5 from Candidacy to Target
  animator.moveTo(
    "#n4n5",
    null,
    addOffset(n4n5Source, CANDIDACY_TO_TARGET_OFFSET),
    {
      duration: DURATION.slow,
      ease: "power2.inOut",
    },
  );

  // Show purple text/label
  animator.show("#purple", { autoAlpha: 1 });

  animator.addLabel("step2");

  // Step 3: Restore step2 elements and move final set of elements to Target

  // First, quickly restore step2 elements to their original positions
  animator.group((a: SVGAnimator) => {
    a.moveTo("#n3", null, n3Source, { duration: DURATION.fast });
    a.moveTo("#n4", null, n4Source, { duration: DURATION.fast });
    a.moveTo("#n4n5", null, n4n5Source, { duration: DURATION.fast });
  });

  // Get source positions from SVG for step3 elements
  const n5n6Source = getElementPosition("#n5n6");
  const n1n2n3Source = getElementPosition("#n1n2n3");

  // Move n1 from Revocation to Target
  animator.moveTo(
    "#n1",
    null,
    addOffset(n1Source, REVOCATION_TO_TARGET_OFFSET),
    {
      duration: DURATION.slow,
      ease: "power2.inOut",
    },
  );

  // Move n5n6 from Revocation to Target
  animator.moveTo(
    "#n5n6",
    null,
    addOffset(n5n6Source, REVOCATION_TO_TARGET_OFFSET),
    {
      duration: DURATION.slow,
      ease: "power2.inOut",
    },
  );

  // Move n1n2n3 from Candidacy to Target
  animator.moveTo(
    "#n1n2n3",
    null,
    addOffset(n1n2n3Source, CANDIDACY_TO_TARGET_OFFSET),
    {
      duration: DURATION.slow,
      ease: "power2.inOut",
    },
  );

  // Show green text/label
  animator.show("#green", { autoAlpha: 1 });

  animator.addLabel("step3");

  // Step 4: Restore all step3 elements to their original positions
  animator.group((a: SVGAnimator) => {
    a.moveTo("#n1", null, n1Source, { duration: DURATION.fast });
    a.moveTo("#n5n6", null, n5n6Source, { duration: DURATION.fast });
    a.moveTo("#n1n2n3", null, n1n2n3Source, { duration: DURATION.fast });
  });

  animator.addLabel("step4");
};
