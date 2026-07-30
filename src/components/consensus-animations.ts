import type { CSSProperties } from 'react';
import type { SVGAnimator } from '@/lib/svg-animator';
import { part06Fig1 } from '@/components/part06Fig1';
import { part06Fig2Scenario1 } from '@/components/part06Fig2Scenario1';
import { part06Fig2Scenario2 } from '@/components/part06Fig2Scenario2';
import { part06Fig2Scenario3 } from '@/components/part06Fig2Scenario3';
import { part06Fig3 } from '@/components/part06Fig3';
import { part07Fig3Raft } from '@/components/part07Fig3Raft';
import { part07Fig3Scenario2 } from '@/components/part07Fig3Scenario2';
import { part07Fig3Scenario3 } from '@/components/part07Fig3Scenario3';
import { part07Fig3Scenario4 } from '@/components/part07Fig3Scenario4';
import { part07Fig3Scenario5 } from '@/components/part07Fig3Scenario5';
import { part08Fig3a } from '@/components/part08Fig3a';
import { part08Fig3b } from '@/components/part08Fig3b';
import { part08Fig3c } from '@/components/part08Fig3c';
import { requestProcessing } from '@/components/requestProcessing';

/**
 * Mirrors the props each figure was authored with before the Fumadocs
 * migration. Kept as data so the restored AnimatedSVG receives exactly what it
 * used to: most figures step manually, one autoplays with a replay button, and
 * the two 2000px-wide ones are deliberately shifted left.
 */
type FigureAnimation = {
  /** Base name of the SVG the animation drives, without directory or content hash */
  svg: string;
  animate: (animator: SVGAnimator) => void;
  autoPlay: boolean;
  showControls: boolean;
  showRestartButton?: boolean;
  width?: number;
  height?: number;
  style?: CSSProperties;
};

const BLOCK: CSSProperties = {
  display: 'block',
  margin: '1rem 0',
  overflow: 'visible',
};

/** part06-fig3 is 2000px wide and authored to hang left of the text column */
const SHIFTED_LEFT: CSSProperties = {
  display: 'inline-block',
  margin: '1rem 0',
  overflow: 'visible',
  transform: 'translateX(-450px)',
};

/**
 * The consensus figures are single SVGs holding every state of a sequence,
 * driven by a GSAP timeline that reveals one step at a time. Several figures
 * share one SVG and differ only in the timeline, so the caption identifies them.
 */
const FIGURE_ANIMATIONS: Record<string, FigureAnimation> = {
  'Multigres consensus and replication diagram': {
    svg: 'requestProcessing',
    animate: requestProcessing,
    autoPlay: false,
    showControls: true,
  },
  'Figure 1: Revocation methods': {
    svg: 'part06-fig1',
    animate: part06Fig1,
    autoPlay: true,
    showControls: false,
    showRestartButton: true,
    width: 900,
    height: 300,
    style: BLOCK,
  },
  'Figure 2: Scenario 1 - No race': {
    svg: 'part06-fig2',
    animate: part06Fig2Scenario1,
    autoPlay: false,
    showControls: true,
    width: 1200,
    height: 400,
    style: BLOCK,
  },
  'Figure 2: Scenario 2 - Newer term steals nodes': {
    svg: 'part06-fig2',
    animate: part06Fig2Scenario2,
    autoPlay: false,
    showControls: true,
    width: 1200,
    height: 400,
    style: BLOCK,
  },
  'Figure 2: Scenario 3 - Newer term starts after scenario 1': {
    svg: 'part06-fig2',
    animate: part06Fig2Scenario3,
    autoPlay: false,
    showControls: true,
    width: 1200,
    height: 400,
    style: BLOCK,
  },
  'Figure 3: All possible leaders': {
    svg: 'part06-fig3',
    animate: part06Fig3,
    autoPlay: false,
    showControls: true,
    width: 2000,
    height: 700,
    style: SHIFTED_LEFT,
  },
  'Figure 1: Term number competition': {
    svg: 'part06-fig3',
    animate: part06Fig3,
    autoPlay: false,
    showControls: true,
    width: 2000,
    height: 700,
    style: SHIFTED_LEFT,
  },
  'Figure 3: Raft timeline propagation': {
    svg: 'part07-fig3',
    animate: part07Fig3Raft,
    autoPlay: false,
    showControls: true,
    width: 1000,
    height: 500,
    style: BLOCK,
  },
  'Figure 4: Initial state': {
    svg: 'part07-fig3',
    animate: part07Fig3Raft,
    autoPlay: false,
    showControls: false,
    width: 1000,
    height: 500,
    style: BLOCK,
  },
  'Figure 5: Scenario 2': {
    svg: 'part07-fig3',
    animate: part07Fig3Scenario2,
    autoPlay: false,
    showControls: true,
    width: 1000,
    height: 500,
    style: BLOCK,
  },
  'Figure 6: Scenario 3': {
    svg: 'part07-fig3',
    animate: part07Fig3Scenario3,
    autoPlay: false,
    showControls: true,
    width: 1000,
    height: 500,
    style: BLOCK,
  },
  'Figure 7: Scenario 4': {
    svg: 'part07-fig3',
    animate: part07Fig3Scenario4,
    autoPlay: false,
    showControls: true,
    width: 1000,
    height: 500,
    style: BLOCK,
  },
  'Figure 8: Scenario 5': {
    svg: 'part07-fig3',
    animate: part07Fig3Scenario5,
    autoPlay: false,
    showControls: true,
    width: 1000,
    height: 500,
    style: BLOCK,
  },
  'Figure 3a: Ruleset change scenario 1': {
    svg: 'part08-fig3',
    animate: part08Fig3a,
    autoPlay: false,
    showControls: true,
    width: 800,
    height: 400,
    style: BLOCK,
  },
  'Figure 3b: Ruleset change scenario 2': {
    svg: 'part08-fig3',
    animate: part08Fig3b,
    autoPlay: false,
    showControls: true,
    width: 800,
    height: 400,
    style: BLOCK,
  },
  'Figure 3c: Ruleset change scenario 3': {
    svg: 'part08-fig3',
    animate: part08Fig3c,
    autoPlay: false,
    showControls: true,
    width: 800,
    height: 400,
    style: BLOCK,
  },
};

/**
 * Dev serves `/img/consensus/part07-fig3.svg`; a build emits
 * `/assets/part07-fig3-DEk2p0Pr.svg`. The hash cannot be stripped lexically —
 * Vite hashes may themselves contain `-` and `_` (`Bexfl0_P`, `DDkSJ-hG`) —
 * so match the known name as a prefix instead.
 */
function matchesSvg(src: string, expected: string): boolean {
  const file = src.split('/').pop()?.split('?')[0] ?? '';
  const base = file.replace(/\.svg$/i, '');
  return base === expected || base.startsWith(`${expected}-`);
}

export function getFigureAnimation(
  src: string,
  alt: string,
): FigureAnimation | undefined {
  const spec = FIGURE_ANIMATIONS[alt.trim()];
  if (!spec) return undefined;
  return matchesSvg(src, spec.svg) ? spec : undefined;
}
