/**
 * Raft Consensus Animation Example
 *
 * This component demonstrates how to animate the Raft consensus diagram
 * showing nodes, data replication, and acknowledgments.
 */

import React from 'react';
import AnimatedSVG from './AnimatedSVG';
import { SVGAnimator } from '../lib/svg-animator';

const RaftAnimationExample: React.FC = () => {
  const handleAnimate = (animator: SVGAnimator) => {
    // Get the timeline for more control
    const timeline = animator.getTimeline();

    // Step 1: Fade in the App node and N1 leader
    animator
      .addLabel('start')
      .fadeIn('g:has(text:contains("App"))', { duration: 0.8 })
      .fadeIn('g:has(text:contains("N1 (leader)"))', { duration: 0.8 })

      // Step 2: Show N1's log entries (A, B, C, D, E)
      .fadeIn('g[transform*="translate(110 170)"]', { duration: 0.5, stagger: 0.1 })
      .fadeIn('g[transform*="translate(150 170)"]', { duration: 0.5, delay: 0.1 })
      .fadeIn('g[transform*="translate(190 170)"]', { duration: 0.5, delay: 0.2 })
      .fadeIn('g[transform*="translate(230 170)"]', { duration: 0.5, delay: 0.3 })
      .fadeIn('g[transform*="translate(270 170)"]', { duration: 0.5, delay: 0.4 })

      .wait(0.5)

      // Step 3: Show follower nodes
      .addLabel('followers')
      .fadeIn('g:has(text:contains("N2 (ack follower)"))', { duration: 0.8 })
      .fadeIn('g:has(text:contains("N3 (ack follower)"))', { duration: 0.8, delay: 0.2 })
      .fadeIn('g:has(text:contains("N4 (non-ack follower)"))', { duration: 0.8, delay: 0.4 })

      // Step 4: Show follower log entries
      .fadeIn('g[transform*="translate(410 50)"] g[stroke-linecap="round"]', {
        duration: 0.4,
        stagger: 0.08
      })
      .fadeIn('g[transform*="translate(410 170)"] g[stroke-linecap="round"]', {
        duration: 0.4,
        stagger: 0.08
      })
      .fadeIn('g[transform*="translate(410 310)"] g[stroke-linecap="round"]', {
        duration: 0.4,
        stagger: 0.08
      })

      .wait(0.5)

      // Step 5: Show acks box
      .addLabel('acks')
      .fadeIn('g:has(text:contains("Acks"))', { duration: 0.6 })
      .fadeIn('g[transform*="translate(10 150)"]', { duration: 0.6 })

      // Step 6: Draw arrows from N1 to App
      .addLabel('replication')
      .drawPath('g[mask*="mask-MC"] path', { duration: 1.5 })

      // Step 7: Draw replication arrows to followers
      .drawPath('g[mask*="mask-pZkJFV"] path', { duration: 1.2 })
      .drawPath('g[mask*="mask-GKJoKjC"] path', { duration: 1.2, delay: 0.2 })
      .drawPath('g[mask*="mask-LPM7zjium"] path', { duration: 1.2, delay: 0.4 })

      .wait(0.5)

      // Step 8: Show "Applied" labels with dashed lines
      .addLabel('applied')
      .fadeIn('g:has(text:contains("Applied"))', { duration: 0.8, stagger: 0.3 })
      .fadeIn('g[stroke-linecap="round"]:has(path[stroke-dasharray])', {
        duration: 0.8,
        stagger: 0.3
      })

      .wait(0.5)

      // Step 9: Show observers box and arrow
      .addLabel('observers')
      .fadeIn('g:has(text:contains("Observers"))', { duration: 0.8 })
      .drawPath('g[mask*="mask-V5Q"] path', { duration: 1.5 })

      // Step 10: Finally show explanation text
      .fadeIn('g[transform*="translate(10 310)"]', { duration: 1 });
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <AnimatedSVG
        src="/img/site/svgviewer-output.svg"
        onAnimate={handleAnimate}
        autoPlay={true}
        width="100%"
        alt="Raft Consensus Animation showing data replication across nodes"
      />
    </div>
  );
};

export default RaftAnimationExample;
