export function getCanvasColor(element: Element, cssValue: string): string {
  const swatch = document.createElement("span");
  swatch.style.color = cssValue;
  swatch.style.display = "none";

  (element.parentElement ?? element.ownerDocument.documentElement).appendChild(
    swatch,
  );

  const resolved = getComputedStyle(swatch).color;
  swatch.remove();

  return toCanvasColor(resolved) ?? "#080808";
}

export function colorWithAlpha(color: string, alpha: number): string {
  const rgb = color.match(
    /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*[\d.]+)?\s*\)$/,
  );

  if (rgb) {
    return `rgba(${rgb[1]}, ${rgb[2]}, ${rgb[3]}, ${alpha})`;
  }

  return color;
}

function toCanvasColor(color: string): string | null {
  const rgb = color.match(
    /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/,
  );

  if (rgb) {
    return rgb[4]
      ? `rgba(${rgb[1]}, ${rgb[2]}, ${rgb[3]}, ${rgb[4]})`
      : `rgb(${rgb[1]}, ${rgb[2]}, ${rgb[3]})`;
  }

  const rgbSpace = color.match(
    /^rgba?\(\s*(\d+)\s+(\d+)\s+(\d+)(?:\s*\/\s*([\d.]+%?))?\s*\)$/,
  );

  if (rgbSpace) {
    const alpha = rgbSpace[4] ? parseCssNumber(rgbSpace[4]) : 1;

    return alpha < 1
      ? `rgba(${rgbSpace[1]}, ${rgbSpace[2]}, ${rgbSpace[3]}, ${alpha})`
      : `rgb(${rgbSpace[1]}, ${rgbSpace[2]}, ${rgbSpace[3]})`;
  }

  const srgb = color.match(
    /^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)$/,
  );

  if (srgb) {
    const red = Math.round(Number(srgb[1]) * 255);
    const green = Math.round(Number(srgb[2]) * 255);
    const blue = Math.round(Number(srgb[3]) * 255);
    const alpha = srgb[4] ? parseCssNumber(srgb[4]) : 1;

    return alpha < 1
      ? `rgba(${red}, ${green}, ${blue}, ${alpha})`
      : `rgb(${red}, ${green}, ${blue})`;
  }

  const oklch = color.match(
    /^oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)$/,
  );

  if (!oklch) return null;

  const lightness = parseCssNumber(oklch[1]);
  const chroma = Number(oklch[2]);
  const hue = Number(oklch[3]);
  const alpha = oklch[4] ? parseCssNumber(oklch[4]) : 1;
  const [red, green, blue] = oklchToRgb(lightness, chroma, hue);

  return alpha < 1
    ? `rgba(${red}, ${green}, ${blue}, ${alpha})`
    : `rgb(${red}, ${green}, ${blue})`;
}

function parseCssNumber(value: string): number {
  return value.endsWith("%") ? Number(value.slice(0, -1)) / 100 : Number(value);
}

function oklchToRgb(lightness: number, chroma: number, hue: number) {
  const hueRadians = (hue * Math.PI) / 180;
  const a = Math.cos(hueRadians) * chroma;
  const b = Math.sin(hueRadians) * chroma;

  const lPrime = lightness + 0.3963377774 * a + 0.2158037573 * b;
  const mPrime = lightness - 0.1055613458 * a - 0.0638541728 * b;
  const sPrime = lightness - 0.0894841775 * a - 1.291485548 * b;

  const l = lPrime ** 3;
  const m = mPrime ** 3;
  const s = sPrime ** 3;

  return [
    linearToRgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    linearToRgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    linearToRgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

function linearToRgb(value: number): number {
  const clamped = Math.min(1, Math.max(0, value));
  const encoded =
    clamped <= 0.0031308
      ? 12.92 * clamped
      : 1.055 * clamped ** (1 / 2.4) - 0.055;

  return Math.round(encoded * 255);
}
