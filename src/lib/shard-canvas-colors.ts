import { colorWithAlpha, getCanvasColor } from "@/lib/canvas-color";

export type ShardGridColors = {
  background: string;
  cellStart: string;
  cellEnd: string;
  cellFillOpacity: number;
  border: string;
  bevelLight: string;
  bevelSoft: string;
  bevelDark: string;
  bevelDarker: string;
  primary: string;
  ledOff: string;
  screw: string;
  vignette: string;
  vignetteEdgeOpacity: number;
  revealGlow: string;
};

function isDarkTheme(element: Element): boolean {
  return (
    element.ownerDocument?.documentElement.classList.contains("dark") ?? false
  );
}

export type BlogShardLayerColors = readonly [
  string,
  string,
  string,
  string,
  string,
];

/** Colors for the landing-page server grid canvas (resolved from theme CSS variables). */
export function resolveShardGridColors(element: Element): ShardGridColors {
  const foreground = getCanvasColor(element, "var(--foreground)");
  const background = getCanvasColor(element, "var(--background)");
  const border = getCanvasColor(element, "var(--border)");
  const primary = getCanvasColor(element, "var(--primary)");

  if (isDarkTheme(element)) {
    return {
      background,
      cellStart: getCanvasColor(
        element,
        "color-mix(in oklch, var(--card) 86%, var(--foreground) 14%)",
      ),
      cellEnd: getCanvasColor(
        element,
        "color-mix(in oklch, var(--card) 82%, var(--background) 18%)",
      ),
      cellFillOpacity: 0.5,
      border,
      bevelLight: getCanvasColor(
        element,
        "color-mix(in oklch, var(--background) 96%, black)",
      ),
      bevelSoft: getCanvasColor(
        element,
        "color-mix(in oklch, var(--background) 94%, black)",
      ),
      bevelDark: getCanvasColor(
        element,
        "color-mix(in oklch, var(--background) 90%, black)",
      ),
      bevelDarker: getCanvasColor(
        element,
        "color-mix(in oklch, var(--background) 86%, black)",
      ),
      primary,
      ledOff: getCanvasColor(
        element,
        "color-mix(in oklch, var(--muted) 82%, var(--primary) 18%)",
      ),
      screw: colorWithAlpha(foreground, 0.5),
      vignette: getCanvasColor(
        element,
        "color-mix(in oklch, var(--background) 84%, black)",
      ),
      vignetteEdgeOpacity: 0.7,
      revealGlow: primary,
    };
  }

  return {
    background,
    cellStart: getCanvasColor(
      element,
      "color-mix(in oklch, var(--card) 94%, var(--background))",
    ),
    cellEnd: getCanvasColor(
      element,
      "color-mix(in oklch, var(--card) 90%, var(--muted))",
    ),
    cellFillOpacity: 0.78,
    border,
    bevelLight: getCanvasColor(
      element,
      "color-mix(in oklch, var(--background) 94%, white)",
    ),
    bevelSoft: getCanvasColor(
      element,
      "color-mix(in oklch, var(--background) 92%, white)",
    ),
    bevelDark: getCanvasColor(
      element,
      "color-mix(in oklch, var(--background) 90%, white)",
    ),
    bevelDarker: getCanvasColor(
      element,
      "color-mix(in oklch, var(--background) 88%, white)",
    ),
    primary,
    ledOff: getCanvasColor(
      element,
      "color-mix(in oklch, var(--muted) 88%, var(--primary) 12%)",
    ),
    screw: colorWithAlpha(foreground, 0.28),
    vignette: getCanvasColor(
      element,
      "color-mix(in oklch, var(--background) 80%, white)",
    ),
    vignetteEdgeOpacity: 0.45,
    revealGlow: primary,
  };
}

/** Five stepped fill colors for blog shard placeholder patterns. */
export function resolveBlogShardLayerColors(
  element: Element,
): BlogShardLayerColors {
  const foreground = getCanvasColor(element, "var(--foreground)");
  const primary = getCanvasColor(element, "var(--primary)");

  return [
    colorWithAlpha(foreground, 0.05),
    colorWithAlpha(foreground, 0.09),
    colorWithAlpha(foreground, 0.14),
    colorWithAlpha(foreground, 0.22),
    colorWithAlpha(primary, 0.38),
  ];
}
