import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { ImgHTMLAttributes } from 'react';
import AnimatedSVG from '@/components/AnimatedSVG';
import { getFigureAnimation } from '@/components/consensus-animations';

const DefaultImg = defaultMdxComponents.img as (
  props: ImgHTMLAttributes<HTMLImageElement>,
) => React.ReactNode;

/**
 * Renders markdown images normally, except for the consensus figures whose SVG
 * is a stack of animation states. Those are handed to AnimatedSVG so the states
 * are revealed one step at a time instead of all at once.
 */
export function AnimatedFigure(props: ImgHTMLAttributes<HTMLImageElement>) {
  const { src, alt } = props;

  if (typeof src === 'string' && typeof alt === 'string') {
    const spec = getFigureAnimation(src, alt);
    if (spec) {
      return (
        <AnimatedSVG
          src={src}
          alt={alt}
          onAnimate={spec.animate}
          autoPlay={spec.autoPlay}
          showControls={spec.showControls}
          showRestartButton={spec.showRestartButton}
          width={spec.width}
          height={spec.height}
          style={spec.style}
        />
      );
    }
  }

  return <DefaultImg {...props} />;
}
