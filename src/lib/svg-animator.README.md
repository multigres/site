# SVG Animation with GSAP

This library provides a powerful yet simple way to animate SVG diagrams using GSAP (GreenSock Animation Platform).

## Installation

GSAP is already installed in this project. No additional dependencies needed!

## Quick Start

### Basic Usage

```typescript
import { createSVGAnimator } from '@site/src/lib/svg-animator';

// Create animator instance
const animator = createSVGAnimator('#my-svg');

// Chain animations
animator
  .fadeIn('.node', { duration: 1, stagger: 0.2 })
  .drawPath('.arrow', { duration: 2 })
  .pulse('.highlight', { duration: 0.5 })
  .play();
```

### Using with React Component

```tsx
import AnimatedSVG from '@site/src/components/AnimatedSVG';

function MyDiagram() {
  return (
    <AnimatedSVG
      src="/img/my-diagram.svg"
      onAnimate={(animator) => {
        animator
          .fadeIn('.nodes', { duration: 1, stagger: 0.2 })
          .drawPath('.connections', { duration: 1.5 })
          .play();
      }}
      autoPlay={true}
    />
  );
}
```

## API Reference

### SVGAnimator Class

#### Constructor
```typescript
new SVGAnimator(svgSelector: string | SVGElement)
```

#### Methods

##### `fadeIn(selector: string, options?: AnimationOptions)`
Fade in elements from opacity 0 to 1.

```typescript
animator.fadeIn('.node', { 
  duration: 1, 
  delay: 0.5, 
  stagger: 0.2 
});
```

##### `fadeOut(selector: string, options?: AnimationOptions)`
Fade out elements from opacity 1 to 0.

##### `scale(selector: string, scale: number, options?: AnimationOptions)`
Scale elements with a bounce effect.

```typescript
animator.scale('.node', 1.5, { 
  duration: 0.8,
  ease: 'back.out(1.7)' 
});
```

##### `drawPath(selector: string, options?: AnimationOptions)`
Animate SVG paths/arrows using stroke-dasharray technique.

```typescript
animator.drawPath('.arrow', { 
  duration: 2,
  ease: 'power2.inOut' 
});
```

##### `slideIn(selector: string, direction: 'left' | 'right' | 'top' | 'bottom', options?: AnimationOptions)`
Slide elements in from a direction.

```typescript
animator.slideIn('.node', 'left', { 
  duration: 0.8,
  stagger: 0.15 
});
```

##### `pulse(selector: string, options?: AnimationOptions)`
Create a pulsing highlight effect.

```typescript
animator.pulse('.active-node', { duration: 0.6 });
```

##### `wait(duration: number)`
Add a pause in the animation timeline.

```typescript
animator
  .fadeIn('.node-1')
  .wait(0.5)
  .fadeIn('.node-2');
```

##### `addLabel(label: string)`
Add a label to the timeline for seeking to specific points.

```typescript
animator
  .addLabel('start')
  .fadeIn('.nodes')
  .addLabel('connections')
  .drawPath('.arrows')
  .seek('connections'); // Jump to connections label
```

##### Playback Controls
- `play()` - Play the animation
- `pause()` - Pause the animation
- `restart()` - Restart from beginning
- `reverse()` - Reverse the animation
- `seek(timeOrLabel: number | string)` - Seek to time or label
- `kill()` - Kill and cleanup the animation

### AnimationOptions Interface

```typescript
interface AnimationOptions {
  duration?: number;      // Animation duration in seconds (default: 0.5-1)
  delay?: number;         // Delay before animation starts (default: 0)
  ease?: string;          // GSAP easing function (default: varies)
  stagger?: number;       // Time between each element (default: 0)
  onComplete?: () => void; // Callback when animation completes
  onStart?: () => void;    // Callback when animation starts
}
```

### Common GSAP Easing Functions

- `'power1.out'`, `'power2.out'`, `'power3.out'`, `'power4.out'`
- `'power1.inOut'`, `'power2.inOut'`, `'power3.inOut'`, `'power4.inOut'`
- `'back.out(1.7)'` - Overshoots then settles
- `'elastic.out(1, 0.3)'` - Elastic bounce
- `'bounce.out'` - Bouncing effect
- `'sine.inOut'` - Smooth sine wave

[Full list of GSAP easings](https://gsap.com/docs/v3/Eases/)

## Examples

### Example 1: Sequential Node Reveal

```typescript
animator
  .fadeIn('.node-1', { duration: 0.5 })
  .fadeIn('.node-2', { duration: 0.5 })
  .fadeIn('.node-3', { duration: 0.5 })
  .drawPath('.arrow-1-2', { duration: 1 })
  .drawPath('.arrow-2-3', { duration: 1 })
  .play();
```

### Example 2: Staggered Grid

```typescript
animator
  .fadeIn('.grid-item', { 
    duration: 0.3, 
    stagger: 0.05,
    ease: 'power2.out'
  })
  .play();
```

### Example 3: Highlight Flow

```typescript
animator
  .fadeIn('.all-nodes', { duration: 0.5, stagger: 0.1 })
  .wait(0.5)
  .pulse('.data-flow', { duration: 0.8 })
  .drawPath('.flow-arrow', { duration: 1.5 })
  .play();
```

### Example 4: Interactive Animation

```tsx
function InteractiveDiagram() {
  const animatorRef = useRef<SVGAnimator | null>(null);

  const handleStepForward = () => {
    animatorRef.current?.play();
  };

  const handleStepBack = () => {
    animatorRef.current?.reverse();
  };

  return (
    <>
      <AnimatedSVG
        src="/img/diagram.svg"
        onAnimate={(animator) => {
          animatorRef.current = animator;
          animator
            .addLabel('step1')
            .fadeIn('.nodes', { duration: 1 })
            .addLabel('step2')
            .drawPath('.connections', { duration: 1.5 });
        }}
        autoPlay={false}
      />
      <button onClick={handleStepForward}>Forward</button>
      <button onClick={handleStepBack}>Back</button>
    </>
  );
}
```

### Example 5: Using Helper Functions

```typescript
import { animations } from '@site/src/lib/svg-animator';

animations.sequentialReveal(
  animator,
  '.node',
  '.arrow',
  { nodeDelay: 0.5, arrowDelay: 1 }
);
```

## Adding IDs to SVG Elements

To make elements easier to target, add unique `id` attributes:

```xml
<!-- Before -->
<g transform="translate(100 100)">
  <rect width="50" height="50"/>
</g>

<!-- After -->
<g id="node-1" transform="translate(100 100)">
  <rect width="50" height="50"/>
</g>
```

Then select with:
```typescript
animator.fadeIn('#node-1', { duration: 1 });
```

## Tips and Best Practices

1. **Use Stagger for Groups**: When animating multiple similar elements, use stagger for a more polished effect.

2. **Chain Wisely**: Each method returns `this`, allowing for clean chaining. Use `wait()` to create pauses.

3. **Labels for Complex Animations**: Use labels to organize complex animations and enable seeking.

4. **Cleanup**: The `AnimatedSVG` component automatically cleans up animations on unmount.

5. **Performance**: GSAP is highly optimized. Most SVG animations will perform smoothly even with many elements.

6. **CSS Classes**: Add temporary classes during animations for additional styling:
   ```typescript
   animator.getTimeline().call(() => {
     element.classList.add('highlighted');
   });
   ```

## Troubleshooting

### Elements Not Animating

1. Check that the selector matches elements in your SVG
2. Verify the SVG has loaded before creating the animator
3. Check browser console for warnings

### Paths Not Drawing

The `drawPath()` method only works with `<path>`, `<line>`, `<polyline>`, `<polygon>`, and `<circle>` elements that have a `stroke`.

### Animation Starts Before SVG Loads

When using `AnimatedSVG` component, animations are automatically deferred until the SVG loads. With the raw `SVGAnimator` class, ensure the SVG is in the DOM first.

## Advanced Usage

### Access Raw GSAP Timeline

```typescript
const timeline = animator.getTimeline();

// Use any GSAP timeline method
timeline.timeScale(2); // Speed up 2x
timeline.repeat(-1); // Loop forever
timeline.yoyo(true); // Reverse on repeat
```

### Custom GSAP Animations

```typescript
import gsap from 'gsap';

animator.getTimeline().add(() => {
  gsap.to('#custom-element', {
    rotation: 360,
    duration: 2,
    transformOrigin: 'center'
  });
});
```

## Resources

- [GSAP Documentation](https://gsap.com/docs/v3/)
- [GSAP Easing Visualizer](https://gsap.com/docs/v3/Eases/)
- [SVG Animation Best Practices](https://css-tricks.com/svg-animation-best-practices/)
