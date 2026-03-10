import { 
  GestureEvent, 
  GestureIntent, 
  TIMING,
  GestureContract 
} from './GestureTypes';

type GestureCallback = (event: GestureEvent) => void;

export class GestureRecognizer {
  private lastTapTime: number = 0;
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  private isLongPress: boolean = false;
  private rotationStartAngle: number | null = null;
  private callbacks: GestureCallback[] = [];

  // Configuration
  private doubleTapMaxInterval = TIMING.DOUBLE_TAP_INTERVAL_MAX_MS;
  private longPressThreshold = TIMING.LONG_PRESS_THRESHOLD_MS;

  onGesture(callback: GestureCallback): void {
    this.callbacks.push(callback);
  }

  private emit(event: GestureEvent): void {
    this.callbacks.forEach(cb => cb(event));
  }

  // Touch event handlers for mobile
  onTouchStart(x: number, y: number): void {
    this.isLongPress = false;
    this.rotationStartAngle = Math.atan2(y, x);
    
    this.longPressTimer = setTimeout(() => {
      this.isLongPress = true;
      this.emit({
        gesture: 'long_press',
        intent: 'move', // Error state - no valid action
        timestamp: Date.now(),
        confidence: 1.0,
      });
    }, this.longPressThreshold);
  }

  onTouchEnd(x: number, y: number): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    if (this.isLongPress) {
      // Long press already emitted
      this.rotationStartAngle = null;
      return;
    }

    const now = Date.now();
    const timeSinceLastTap = now - this.lastTapTime;

    if (timeSinceLastTap <= this.doubleTapMaxInterval) {
      // Double tap detected
      this.lastTapTime = 0; // Reset to prevent triple-tap
      this.emit({
        gesture: 'double_tap',
        intent: 'move', // Intent sent
        timestamp: now,
        confidence: 1.0,
      });
    } else {
      this.lastTapTime = now;
    }

    this.rotationStartAngle = null;
  }

  onRotate(currentX: number, currentY: number): void {
    if (this.rotationStartAngle === null) return;

    const currentAngle = Math.atan2(currentY, currentX);
    const deltaAngle = Math.abs(currentAngle - this.rotationStartAngle);
    
    // Rotate confirmed - threshold crossed
    if (deltaAngle > Math.PI / 4) { // 45 degrees
      this.emit({
        gesture: 'rotate',
        intent: 'rotate',
        timestamp: Date.now(),
        confidence: Math.min(deltaAngle / Math.PI, 1.0),
      });
      this.rotationStartAngle = currentAngle; // Reset for continuous
    }
  }

  onDrag(xDelta: number, yDelta: number): void {
    // MOVE gesture - horizontal drag
    if (Math.abs(xDelta) > Math.abs(yDelta)) {
      // Horizontal drag = MOVE
    }
  }

  // Cleanup
  destroy(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
    }
    this.callbacks = [];
  }
}

// Factory function
export function createGestureRecognizer(): GestureRecognizer {
  return new GestureRecognizer();
}
