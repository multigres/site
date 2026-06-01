export const LANDING_ANIMATION_CONFIG = {
  LOGO_TARGET_SIZE: 120,
  LOGO_SIZE_IN_CELL: 0.22,
  CELL_SIZE: 100,
  DOT_SIZE: 6,
  LOGO_SPAN: 3,
  FINAL_TRANSLATE_Y: -8,
  GRID_FADE_DURATION: 600,
  INITIAL_DELAY: 1500,
  ZOOM_DURATION: 4000,
  CONTENT_FADE_DURATION: 1000,
  BOTTOM_FADE_HEIGHT_VH: 62,
} as const;

export type LandingAnimationPhase =
  | "hidden"
  | "initial"
  | "zooming"
  | "complete";

export type GridDimensions = {
  cols: number;
  rows: number;
  cellSize: number;
};

export type ShardMetrics = ReturnType<typeof getShardMetrics>;

export function ensureOdd(n: number): number {
  return n % 2 === 0 ? n + 1 : n;
}

export function getGridDimensions(width: number, height: number): GridDimensions {
  if (width === 0 || height === 0) {
    return {
      cols: 11,
      rows: 9,
      cellSize: LANDING_ANIMATION_CONFIG.CELL_SIZE,
    };
  }

  return {
    cols: ensureOdd(Math.ceil(width / LANDING_ANIMATION_CONFIG.CELL_SIZE)),
    rows: ensureOdd(Math.ceil(height / LANDING_ANIMATION_CONFIG.CELL_SIZE)),
    cellSize: LANDING_ANIMATION_CONFIG.CELL_SIZE,
  };
}

export function getGridCenter(dimensions: GridDimensions) {
  const centerCol =
    Math.floor(dimensions.cols / 2) -
    Math.floor(LANDING_ANIMATION_CONFIG.LOGO_SPAN / 2);
  const centerRow =
    Math.floor(dimensions.rows / 2) -
    Math.floor(LANDING_ANIMATION_CONFIG.LOGO_SPAN / 2);

  return { centerCol, centerRow };
}

export function getInitialGridScale(dimensions: GridDimensions): number {
  const logoSizeInCell =
    dimensions.cellSize *
    LANDING_ANIMATION_CONFIG.LOGO_SPAN *
    LANDING_ANIMATION_CONFIG.LOGO_SIZE_IN_CELL;

  return LANDING_ANIMATION_CONFIG.LOGO_TARGET_SIZE / logoSizeInCell;
}

export function isCellHiddenByLogo(
  row: number,
  col: number,
  dimensions: GridDimensions,
): boolean {
  const { centerCol, centerRow } = getGridCenter(dimensions);

  return (
    row >= centerRow &&
    row < centerRow + LANDING_ANIMATION_CONFIG.LOGO_SPAN &&
    col >= centerCol &&
    col < centerCol + LANDING_ANIMATION_CONFIG.LOGO_SPAN
  );
}

export function isLogoCellStart(
  row: number,
  col: number,
  dimensions: GridDimensions,
): boolean {
  const { centerCol, centerRow } = getGridCenter(dimensions);

  return row === centerRow && col === centerCol;
}

export function getShardMetrics(row: number, col: number) {
  const seed = row * 97 + col * 31;

  return {
    id: `shard-${row.toString().padStart(2, "0")}${col
      .toString()
      .padStart(2, "0")}`,
    lagMs: 2 + (seed % 140),
    qps: 250 + ((seed * 13) % 1750),
    latencyMs: 4 + ((seed * 5) % 36),
    errorRate: 0.02 + ((seed * 7) % 40) / 100,
  };
}

export function getShardBlinkTiming(row: number, col: number) {
  const seed = row * 92821 + col * 68917;

  return {
    blinkDuration: 1800 + seededUnit(seed + 11) * 2500,
    turnOnDelay: seededUnit(seed + 23) * (LANDING_ANIMATION_CONFIG.ZOOM_DURATION / 2),
    blinkOnDuration: 150 + seededUnit(seed + 37) * 100,
  };
}

export function hitTestShard(
  x: number,
  y: number,
  dimensions: GridDimensions,
) {
  const col = Math.floor(x / dimensions.cellSize);
  const row = Math.floor(y / dimensions.cellSize);

  if (
    row < 0 ||
    col < 0 ||
    row >= dimensions.rows ||
    col >= dimensions.cols ||
    isCellHiddenByLogo(row, col, dimensions)
  ) {
    return null;
  }

  return { row, col };
}

function seededUnit(seed: number): number {
  const value = Math.sin(seed) * 10000;

  return value - Math.floor(value);
}
