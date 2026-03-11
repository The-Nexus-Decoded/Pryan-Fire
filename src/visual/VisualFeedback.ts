// Visual Feedback - V1 Spec
// Based on spatial-ui-contract.md

export type VisualFeedbackType = 'glow' | 'scale_pulse' | 'shake';

interface VisualConfig {
  glowColor?: string;
  scaleMin?: number;
  scaleMax?: number;
  shakeDistance?: number;
  shakeCycles?: number;
}

// Default configurations per spec
const VISUAL_CONFIGS: Record<VisualFeedbackType, VisualConfig> = {
  glow: {
    glowColor: 'cyan', // DOUBLE-TAP → Intent sent
  },
  scale_pulse: {
    scaleMin: 1.0,
    scaleMax: 1.05, // ROTATE → Confirmed
  },
  shake: {
    shakeDistance: 10, // LONG-PRESS → Error
    shakeCycles: 3,
  },
};

export class VisualFeedback {
  private element: HTMLElement | null = null;
  private animations: Map<string, number> = new Map();

  setElement(el: HTMLElement): void {
    this.element = el;
  }

  // DOUBLE-TAP → Cyan glow (200ms)
  glow(color: string = 'cyan', duration: number = 200): void {
    if (!this.element) return;

    this.cancelAnimation('glow');
    
    const originalBoxShadow = this.element.style.boxShadow;
    this.element.style.boxShadow = `0 0 20px ${color}, 0 0 40px ${color}`;
    this.element.style.transition = `box-shadow ${duration}ms ease-out`;

    const animId = window.setTimeout(() => {
      this.element!.style.boxShadow = originalBoxShadow;
      this.animations.delete('glow');
    }, duration);

    this.animations.set('glow', animId);
  }

  // ROTATE → Scale pulse (1.0 → 1.05 → 1.0, 200ms)
  scalePulse(
    minScale: number = 1.0, 
    maxScale: number = 1.05, 
    duration: number = 200
  ): void {
    if (!this.element) return;

    this.cancelAnimation('scale');
    
    const originalTransform = this.element.style.transform;
    const originalTransition = this.element.style.transition;

    this.element.style.transition = `transform ${duration}ms ease-in-out`;
    
    // Pulse up
    requestAnimationFrame(() => {
      if (!this.element) return;
      this.element.style.transform = `scale(${maxScale})`;
      
      // Pulse back down
      setTimeout(() => {
        if (this.element) {
          this.element.style.transform = `scale(${minScale})`;
        }
      }, duration / 2);

      // Restore
      setTimeout(() => {
        if (this.element) {
          this.element.style.transform = originalTransform;
          this.element.style.transition = originalTransition;
        }
        this.animations.delete('scale');
      }, duration);
    });

    this.animations.set('scale', Date.now());
  }

  // LONG-PRESS ERROR → Red outline + shake (10px L-R, 3 cycles, 300ms)
  shakeError(
    distance: number = 10, 
    cycles: number = 3, 
    duration: number = 300
  ): void {
    if (!this.element) return;

    this.cancelAnimation('shake');

    const originalTransform = this.element.style.transform;
    const originalOutline = this.element.style.outline;
    
    // Red outline
    this.element.style.outline = '2px solid red';
    
    const startTime = Date.now();
    const animate = () => {
      if (!this.element) return;
      
      const elapsed = Date.now() - startTime;
      if (elapsed >= duration) {
        this.element.style.transform = originalTransform;
        this.element.style.outline = originalOutline;
        this.animations.delete('shake');
        return;
      }

      const progress = elapsed / duration;
      const offset = Math.sin(progress * cycles * Math.PI * 2) * distance;
      this.element.style.transform = `translateX(${offset}px)`;
      
      requestAnimationFrame(animate);
    };

    this.animations.set('shake', Date.now());
    requestAnimationFrame(animate);
  }

  private cancelAnimation(key: string): void {
    const id = this.animations.get(key);
    if (id) {
      clearTimeout(id);
      this.animations.delete(key);
    }
  }

  destroy(): void {
    this.animations.forEach((id) => clearTimeout(id));
    this.animations.clear();
    this.element = null;
  }
}

export function createVisualFeedback(element?: HTMLElement): VisualFeedback {
  const feedback = new VisualFeedback();
  if (element) {
    feedback.setElement(element);
  }
  return feedback;
}
