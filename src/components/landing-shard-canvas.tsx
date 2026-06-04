"use client";

import { MultigresLogo } from "@/components/multigres-logo";
import { colorWithAlpha } from "@/lib/canvas-color";
import { resolveShardGridColors } from "@/lib/shard-canvas-colors";
import { useThemeRevision } from "@/hooks/use-theme-revision";
import {
  getGridCenter,
  getGridDimensions,
  getInitialGridScale,
  getShardBlinkTiming,
  isCellHiddenByLogo,
  isLogoCellStart,
  LANDING_ANIMATION_CONFIG,
  type GridDimensions,
  type LandingAnimationPhase,
} from "@/lib/landing-animation";
import { useEffect, useMemo, useRef, useState } from "react";

const ZOOM_EASING = "cubic-bezier(0.4, 0, 0.2, 1)";
const COMPLETE_FRAME_INTERVAL_MS = 1000 / 20;

type LandingShardCanvasProps = {
  phase: LandingAnimationPhase;
  gridVisible: boolean;
  isAnimating: boolean;
  reduceMotion?: boolean;
};

export function LandingShardCanvas({
  phase,
  gridVisible,
  isAnimating,
  reduceMotion = false,
}: LandingShardCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const animationTimeoutRef = useRef<number | null>(null);
  const blinkStartAtRef = useRef<number | null>(null);
  const completeStartAtRef = useRef<number | null>(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const themeRevision = useThemeRevision();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const nextSize = {
        width: Math.round(container.clientWidth),
        height: Math.round(container.clientHeight),
      };

      setViewportSize((currentSize) => {
        if (
          currentSize.width === nextSize.width &&
          currentSize.height === nextSize.height
        ) {
          return currentSize;
        }

        return nextSize;
      });
    };

    updateSize();

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  const gridDimensions = useMemo(
    () => getGridDimensions(viewportSize.width, viewportSize.height),
    [viewportSize],
  );

  const initialScale = useMemo(
    () => getInitialGridScale(gridDimensions),
    [gridDimensions],
  );

  const gridWidth = gridDimensions.cols * gridDimensions.cellSize;
  const gridHeight = gridDimensions.rows * gridDimensions.cellSize;
  const isZoomedIn = phase === "hidden" || phase === "initial";
  const currentScale = isZoomedIn ? initialScale : 1;
  const currentTranslateY = isZoomedIn
    ? 0
    : LANDING_ANIMATION_CONFIG.FINAL_TRANSLATE_Y;
  const logoBox = getLogoBox(gridDimensions);

  useEffect(() => {
    if (phase === "zooming" && blinkStartAtRef.current === null) {
      blinkStartAtRef.current = performance.now();
    }

    if (phase === "complete" && completeStartAtRef.current === null) {
      completeStartAtRef.current = performance.now();
    }

    if (phase === "hidden" || phase === "initial") {
      blinkStartAtRef.current = null;
      completeStartAtRef.current = null;
    }
  }, [phase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const clearScheduledRender = () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (animationTimeoutRef.current !== null) {
        window.clearTimeout(animationTimeoutRef.current);
      }

      animationFrameRef.current = null;
      animationTimeoutRef.current = null;
    };

    const render = () => {
      drawGridCanvas({
        canvas,
        dimensions: gridDimensions,
        phase,
        blinkStartAt: blinkStartAtRef.current,
        completeStartAt: completeStartAtRef.current,
        now: performance.now(),
        reduceMotion,
      });

      const needsContinuousRender =
        !reduceMotion && (phase === "zooming" || phase === "complete");

      if (needsContinuousRender) {
        if (phase === "complete") {
          animationTimeoutRef.current = window.setTimeout(() => {
            animationFrameRef.current = requestAnimationFrame(render);
          }, COMPLETE_FRAME_INTERVAL_MS);
          return;
        }

        animationFrameRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return clearScheduledRender;
  }, [gridDimensions, phase, reduceMotion, themeRevision]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden flex items-center justify-center bg-background"
      style={{ contain: "layout paint style" }}
    >
      <div
        ref={gridRef}
        className="relative"
        style={{
          width: gridWidth,
          height: gridHeight,
          opacity: gridVisible ? 1 : 0,
          transform: `translate3d(0, ${currentTranslateY}%, 0) scale(${currentScale})`,
          transformOrigin: "center center",
          transition: reduceMotion
            ? "none"
            : isAnimating
              ? `transform ${LANDING_ANIMATION_CONFIG.ZOOM_DURATION}ms ${ZOOM_EASING}, opacity ${LANDING_ANIMATION_CONFIG.GRID_FADE_DURATION}ms ease-out`
              : `opacity ${LANDING_ANIMATION_CONFIG.GRID_FADE_DURATION}ms ease-out`,
          willChange: phase === "zooming" ? "transform" : undefined,
        }}
      >
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="block"
          style={{
            width: gridWidth,
            height: gridHeight,
          }}
        />
        <div
          aria-hidden="true"
          className="absolute pointer-events-none"
          style={{
            left: logoBox.logoLeft,
            top: logoBox.logoTop,
            width: logoBox.logoSize,
            height: logoBox.logoSize,
          }}
        >
          <MultigresLogo className="size-full text-primary" />
        </div>
      </div>
    </div>
  );
}

function drawGridCanvas({
  canvas,
  dimensions,
  phase,
  blinkStartAt,
  completeStartAt,
  now,
  reduceMotion,
}: {
  canvas: HTMLCanvasElement;
  dimensions: GridDimensions;
  phase: LandingAnimationPhase;
  blinkStartAt: number | null;
  completeStartAt: number | null;
  now: number;
  reduceMotion: boolean;
}) {
  const context = canvas.getContext("2d");
  if (!context) return;

  const dpr = window.devicePixelRatio || 1;
  const width = dimensions.cols * dimensions.cellSize;
  const height = dimensions.rows * dimensions.cellSize;
  const pixelWidth = Math.ceil(width * dpr);
  const pixelHeight = Math.ceil(height * dpr);

  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }

  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, width, height);

  const colors = resolveShardGridColors(canvas);
  context.fillStyle = colors.background;
  context.fillRect(0, 0, width, height);

  for (let row = 0; row < dimensions.rows; row += 1) {
    for (let col = 0; col < dimensions.cols; col += 1) {
      if (isLogoCellStart(row, col, dimensions)) {
        drawLogoCell(context, row, col, dimensions, colors);
        continue;
      }

      if (isCellHiddenByLogo(row, col, dimensions)) {
        continue;
      }

      drawServerCell({
        context,
        row,
        col,
        dimensions,
        phase,
        blinkStartAt,
        now,
        reduceMotion,
        colors,
      });
    }
  }

  drawRevealLight(
    context,
    width,
    height,
    colors.revealGlow,
    reduceMotion
      ? 0
      : getRevealOpacity(phase, blinkStartAt, completeStartAt, now),
  );
  drawGridVignette(
    context,
    width,
    height,
    colors.vignette,
    colors.vignetteEdgeOpacity,
  );
}

type GridColors = ReturnType<typeof resolveShardGridColors>;

function drawServerCell({
  context,
  row,
  col,
  dimensions,
  phase,
  blinkStartAt,
  now,
  reduceMotion,
  colors,
}: {
  context: CanvasRenderingContext2D;
  row: number;
  col: number;
  dimensions: GridDimensions;
  phase: LandingAnimationPhase;
  blinkStartAt: number | null;
  now: number;
  reduceMotion: boolean;
  colors: GridColors;
}) {
  const x = col * dimensions.cellSize;
  const y = row * dimensions.cellSize;

  drawCellChrome(context, x, y, dimensions.cellSize, dimensions.cellSize, colors);

  if (reduceMotion && phase === "complete") {
    drawLedDot(
      context,
      x + dimensions.cellSize / 2,
      y + dimensions.cellSize / 2,
      colors.primary,
    );
    return;
  }

  const blinkElapsed =
    phase === "zooming" || phase === "complete"
      ? Math.max(0, now - (blinkStartAt ?? now))
      : 0;
  const timing = getShardBlinkTiming(row, col);
  const litElapsed = blinkElapsed - timing.turnOnDelay;

  if (litElapsed < 0) {
    return;
  }

  const cyclePosition = litElapsed % timing.blinkDuration;
  const hasReachedFirstBlink = litElapsed >= timing.blinkDuration;
  const isBlinking =
    hasReachedFirstBlink && cyclePosition <= timing.blinkOnDuration;

  drawLedDot(
    context,
    x + dimensions.cellSize / 2,
    y + dimensions.cellSize / 2,
    isBlinking ? colors.primary : colors.ledOff,
  );
}

function drawLogoCell(
  context: CanvasRenderingContext2D,
  row: number,
  col: number,
  dimensions: GridDimensions,
  colors: GridColors,
) {
  const size =
    dimensions.cellSize * LANDING_ANIMATION_CONFIG.LOGO_SPAN;
  const x = col * dimensions.cellSize;
  const y = row * dimensions.cellSize;

  drawCellChrome(context, x, y, size, size, colors);
  drawCornerScrew(context, x + 12, y + 12, colors);
  drawCornerScrew(context, x + size - 12, y + 12, colors);
  drawCornerScrew(context, x + 12, y + size - 12, colors);
  drawCornerScrew(context, x + size - 12, y + size - 12, colors);
}

function drawCellChrome(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  colors: GridColors,
) {
  const gradient = context.createLinearGradient(x, y, x + width, y + height);
  gradient.addColorStop(0, colorWithAlpha(colors.cellStart, colors.cellFillOpacity));
  gradient.addColorStop(1, colorWithAlpha(colors.cellEnd, colors.cellFillOpacity));

  context.fillStyle = gradient;
  context.fillRect(x, y, width, height);

  context.lineWidth = 1;
  context.strokeStyle = colors.border;
  context.beginPath();
  context.moveTo(x + 0.5, y);
  context.lineTo(x + 0.5, y + height);
  context.moveTo(x, y + 0.5);
  context.lineTo(x + width, y + 0.5);
  context.stroke();

  context.strokeStyle = colors.bevelLight;
  context.beginPath();
  context.moveTo(x + 1.5, y + 1.5);
  context.lineTo(x + width - 1.5, y + 1.5);
  context.stroke();

  context.strokeStyle = colors.bevelSoft;
  context.beginPath();
  context.moveTo(x + 1.5, y + 1.5);
  context.lineTo(x + 1.5, y + height - 1.5);
  context.stroke();

  context.strokeStyle = colors.bevelDark;
  context.beginPath();
  context.moveTo(x + 1.5, y + height - 1.5);
  context.lineTo(x + width - 1.5, y + height - 1.5);
  context.stroke();

  context.strokeStyle = colors.bevelDarker;
  context.beginPath();
  context.moveTo(x + width - 1.5, y + 1.5);
  context.lineTo(x + width - 1.5, y + height - 1.5);
  context.stroke();
}

function drawLedDot(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
) {
  context.fillStyle = color;
  context.beginPath();
  context.arc(
    x,
    y,
    LANDING_ANIMATION_CONFIG.DOT_SIZE / 2,
    0,
    Math.PI * 2,
  );
  context.fill();
}

function drawCornerScrew(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  colors: GridColors,
) {
  context.strokeStyle = colors.screw;
  context.lineWidth = 1;
  context.beginPath();
  context.arc(x, y, 4, 0, Math.PI * 2);
  context.stroke();
}

function drawRevealLight(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  primary: string,
  opacity: number,
) {
  if (opacity <= 0) return;

  const radius = Math.max(width, height) * 0.55;
  const gradient = context.createRadialGradient(
    width / 2,
    height / 2,
    0,
    width / 2,
    height / 2,
    radius,
  );
  gradient.addColorStop(0, colorWithAlpha(primary, 0.08 * opacity));
  gradient.addColorStop(0.5, colorWithAlpha(primary, 0));

  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
}

function drawGridVignette(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  background: string,
  edgeOpacity: number,
) {
  const radius = Math.max(width, height) * 0.65;
  const gradient = context.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.2,
    width / 2,
    height / 2,
    radius,
  );
  gradient.addColorStop(0, colorWithAlpha(background, 0));
  gradient.addColorStop(1, colorWithAlpha(background, edgeOpacity));

  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
}

function getRevealOpacity(
  phase: LandingAnimationPhase,
  blinkStartAt: number | null,
  completeStartAt: number | null,
  now: number,
) {
  if (phase === "zooming") {
    const elapsed = Math.max(0, now - (blinkStartAt ?? now));

    return Math.min(1, elapsed / LANDING_ANIMATION_CONFIG.ZOOM_DURATION);
  }

  if (phase === "complete") {
    const elapsed = Math.max(0, now - (completeStartAt ?? now));

    return Math.max(0, 1 - elapsed / LANDING_ANIMATION_CONFIG.ZOOM_DURATION);
  }

  return 0;
}

function getLogoBox(dimensions: GridDimensions) {
  const { centerCol, centerRow } = getGridCenter(dimensions);
  const spanSize =
    dimensions.cellSize * LANDING_ANIMATION_CONFIG.LOGO_SPAN;
  const logoSize = spanSize * LANDING_ANIMATION_CONFIG.LOGO_SIZE_IN_CELL;

  return {
    logoLeft: centerCol * dimensions.cellSize + (spanSize - logoSize) / 2,
    logoTop: centerRow * dimensions.cellSize + (spanSize - logoSize) / 2,
    logoSize,
  };
}
