"use client";

import { useThemeRevision } from "@/hooks/use-theme-revision";
import { getCanvasColor } from "@/lib/canvas-color";
import {
  resolveBlogShardLayerColors,
  type BlogShardLayerColors,
} from "@/lib/shard-canvas-colors";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

type BlogShardPlaceholderProps = {
  seed: string;
  className?: string;
};

type Random = () => number;

const MAX_DPR = 2;

export function BlogShardPlaceholder({
  seed,
  className,
}: BlogShardPlaceholderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const themeRevision = useThemeRevision();

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const draw = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;

      if (width === 0 || height === 0) return;

      const layerColors = resolveBlogShardLayerColors(canvas);
      drawPlaceholder(canvas, width, height, seed, layerColors);
    };

    draw();

    const resizeObserver = new ResizeObserver(draw);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [seed, themeRevision]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative size-full overflow-hidden bg-background",
        className,
      )}
    >
      <canvas ref={canvasRef} aria-hidden="true" className="block size-full" />
    </div>
  );
}

function drawPlaceholder(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  seed: string,
  layerColors: BlogShardLayerColors,
) {
  const context = canvas.getContext("2d");
  if (!context) return;

  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  const pixelWidth = Math.ceil(width * dpr);
  const pixelHeight = Math.ceil(height * dpr);

  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }

  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, width, height);

  const seedHash = hashString(seed);
  const random = createRandom(seedHash);
  const family = seedHash % 3;
  const grid = createGrid(width, height, random);

  context.fillStyle = getCanvasColor(canvas, "var(--background)");
  context.fillRect(0, 0, width, height);

  drawBaseField(context, grid, random, layerColors);
  drawPatternFamily(context, grid, family, random, layerColors);
  drawSparseHighlights(context, grid, random, layerColors);
}

function drawBaseField(
  context: CanvasRenderingContext2D,
  grid: Grid,
  random: Random,
  layerColors: BlogShardLayerColors,
) {
  for (let row = 0; row < grid.rows; row += 1) {
    for (let col = 0; col < grid.cols; col += 1) {
      if (random() > 0.52) {
        drawSquare(context, grid, col, row, layerColors[0]);
      }
    }
  }
}

function drawPatternFamily(
  context: CanvasRenderingContext2D,
  grid: Grid,
  family: number,
  random: Random,
  layerColors: BlogShardLayerColors,
) {
  if (family === 0) {
    drawCenteredPattern(context, grid, random, layerColors);
    return;
  }

  if (family === 1) {
    drawDiagonalPattern(context, grid, random, layerColors);
    return;
  }

  drawColumnPattern(context, grid, random, layerColors);
}

function drawCenteredPattern(
  context: CanvasRenderingContext2D,
  grid: Grid,
  random: Random,
  layerColors: BlogShardLayerColors,
) {
  const centerCol = Math.floor(grid.cols / 2) + Math.floor((random() - 0.5) * 4);
  const centerRow = Math.floor(grid.rows / 2) + Math.floor((random() - 0.5) * 3);
  const radius = 6 + Math.floor(random() * 4);

  for (let row = 0; row < grid.rows; row += 1) {
    for (let col = 0; col < grid.cols; col += 1) {
      const distance = Math.abs(col - centerCol) + Math.abs(row - centerRow);
      if (distance <= radius && random() > distance / (radius + 4)) {
        drawSquare(
          context,
          grid,
          col,
          row,
          pickSquareColor(random, distance === 0, layerColors),
        );
      }
    }
  }
}

function drawDiagonalPattern(
  context: CanvasRenderingContext2D,
  grid: Grid,
  random: Random,
  layerColors: BlogShardLayerColors,
) {
  const slope = random() > 0.5 ? 1 : -1;
  const offset = Math.floor(random() * grid.rows);
  const bandWidth = 4 + Math.floor(random() * 4);

  for (let col = 0; col < grid.cols; col += 1) {
    const centerRow =
      slope === 1
        ? (col + offset) % grid.rows
        : (grid.rows - 1 - ((col + offset) % grid.rows));

    for (let step = -bandWidth; step <= bandWidth; step += 1) {
      const row = centerRow + step;
      if (row >= 0 && row < grid.rows && random() > Math.abs(step) / (bandWidth + 3)) {
        drawSquare(
          context,
          grid,
          col,
          row,
          pickSquareColor(random, step === 0, layerColors),
        );
      }
    }
  }
}

function drawColumnPattern(
  context: CanvasRenderingContext2D,
  grid: Grid,
  random: Random,
  layerColors: BlogShardLayerColors,
) {
  const columnCount = 9 + Math.floor(random() * 7);

  for (let index = 0; index < columnCount; index += 1) {
    const col = Math.floor(random() * grid.cols);
    const startRow = Math.floor(random() * grid.rows * 0.35);
    const length = 6 + Math.floor(random() * grid.rows * 0.65);

    for (let row = startRow; row < Math.min(grid.rows, startRow + length); row += 1) {
      if (random() > 0.08) {
        drawSquare(
          context,
          grid,
          col,
          row,
          pickSquareColor(random, row === startRow, layerColors),
        );
      }
    }
  }
}

function drawSparseHighlights(
  context: CanvasRenderingContext2D,
  grid: Grid,
  random: Random,
  layerColors: BlogShardLayerColors,
) {
  const count = 18 + Math.floor(random() * 18);

  for (let index = 0; index < count; index += 1) {
    drawSquare(
      context,
      grid,
      Math.floor(random() * grid.cols),
      Math.floor(random() * grid.rows),
      layerColors[4],
    );
  }
}

function drawSquare(
  context: CanvasRenderingContext2D,
  grid: Grid,
  col: number,
  row: number,
  color: string,
) {
  const x = grid.offsetX + col * grid.pitch;
  const y = grid.offsetY + row * grid.pitch;

  context.save();
  context.globalAlpha = getBottomFadeAlpha(grid, row);
  context.fillStyle = color;
  context.fillRect(x, y, grid.squareSize, grid.squareSize);
  context.restore();
}

type Grid = {
  cols: number;
  rows: number;
  pitch: number;
  squareSize: number;
  offsetX: number;
  offsetY: number;
};

function createGrid(
  width: number,
  height: number,
  random: Random,
): Grid {
  const pitch = clamp(Math.floor(Math.min(width, height) / 19), 7, 11);
  const squareSize = Math.max(3, Math.floor(pitch * (0.52 + random() * 0.16)));
  const cols = Math.ceil(width / pitch) + 2;
  const rows = Math.ceil(height / pitch) + 2;

  return {
    cols,
    rows,
    pitch,
    squareSize,
    offsetX: -pitch + Math.floor(random() * pitch),
    offsetY: -pitch + Math.floor(random() * pitch),
  };
}

function pickSquareColor(
  random: Random,
  isEmphasis: boolean,
  layerColors: BlogShardLayerColors,
) {
  if (isEmphasis) {
    return random() > 0.4 ? layerColors[4] : layerColors[3];
  }

  const value = random();

  if (value > 0.82) return layerColors[3];
  if (value > 0.52) return layerColors[2];
  return layerColors[1];
}

function getBottomFadeAlpha(grid: Grid, row: number) {
  const position = row / Math.max(1, grid.rows - 1);
  const fade = smoothstep(0.58, 1, position);

  return 1 - fade * 0.86;
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);

  return t * t * (3 - 2 * t);
}

function createRandom(seed: number): Random {
  let value = seed || 1;

  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);

    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
