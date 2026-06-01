import { useTheme } from "fumadocs-ui/provider/base";

/** Bumps when the resolved light/dark theme changes so canvases can redraw. */
export function useThemeRevision(): string {
  const { resolvedTheme } = useTheme();

  return resolvedTheme ?? "system";
}
