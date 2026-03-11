/**
 * XR Gesture-Haptic System
 * V1 Implementation
 * 
 * Based on:
 * - Arianus-Sky/docs/spatial-ui-contract.md
 * - Arianus-Sky/docs/ambient-skin-spec.md
 */

export { GestureRecognizer, createGestureRecognizer } from './gesture';
export { HapticEngine, createHapticEngine, HAPTIC_PATTERNS } from './haptics';
export { VisualFeedback, createVisualFeedback } from './visual';
export { XRGestureBridge, createXRGestureBridge } from './bridge';

export { GestureContract, GestureIntent, PreviewType, TIMING, WORLD_UNITS } from './gesture/GestureTypes';
export type { GestureEvent, XRGestureMessage, XRTarget } from './bridge/XRGestureBridge';
export type { HapticEvent } from './haptics/HapticEngine';
export type { VisualFeedbackType } from './visual/VisualFeedback';

/**
 * Complete XR Gesture-Haptic Controller
 * Ties together gesture recognition, haptics, visual feedback, and XR bridge
 */
import { GestureRecognizer, createGestureRecognizer } from './gesture';
import { HapticEngine, createHapticEngine } from './haptics';
import { VisualFeedback, createVisualFeedback } from './visual';
import { XRGestureBridge, createXRGestureBridge } from './bridge';
import { GestureContract, GestureIntent, TIMING } from './gesture/GestureTypes';
import { HapticEvent } from './haptics/HapticEngine';

export class XRGestureHapticController {
  private gestureRecognizer: GestureRecognizer;
  private hapticEngine: HapticEngine;
  private visualFeedback: VisualFeedback;
  private bridge: XRGestureBridge;

  constructor(targetElement?: HTMLElement, xrTargetOrigin?: string) {
    this.gestureRecognizer = createGestureRecognizer();
    this.hapticEngine = createHapticEngine();
    this.visualFeedback = createVisualFeedback(targetElement);
    this.bridge = createXRGestureBridge(xrTargetOrigin);

    this.setupGestureHandler();
  }

  private setupGestureHandler(): void {
    this.gestureRecognizer.onGesture((event) => {
      switch (event.gesture) {
        case 'double_tap':
          this.handleIntentSent();
          break;
        case 'rotate':
          this.handleConfirmed();
          break;
        case 'long_press':
          this.handleError();
          break;
      }
    });
  }

  private handleIntentSent(): void {
    // Visual: Cyan glow
    this.visualFeedback.glow('cyan', 200);
    // Haptic: Single 35ms pulse, Medium
    this.hapticEngine.play('intent_sent');
    // Send preview to headset
    const contract = this.createContract('move');
    this.bridge.sendPreview(contract);
  }

  private handleConfirmed(): void {
    // Visual: Scale pulse (1.0 → 1.05 → 1.0, 200ms)
    this.visualFeedback.scalePulse(1.0, 1.05, 200);
    // Haptic: Double 50ms pulse, 80ms gap, High
    this.hapticEngine.play('confirmed');
    // Commit geometry
    const contract = this.createContract('rotate');
    this.bridge.commit(contract);
  }

  private handleError(): void {
    // Visual: Red outline + shake
    this.visualFeedback.shakeError(10, 3, 300);
    // Haptic: Triple 40ms pulse, 50ms gaps, High
    this.hapticEngine.play('error');
    // Cancel any pending preview
    const contract = this.createContract('move');
    this.bridge.cancelPreview(contract);
  }

  private createContract(action: GestureIntent): GestureContract {
    return {
      intent: 'manipulate',
      action,
      method: 'touch_drag',
      preview: {
        type: action === 'rotate' ? 'rotation_ring' : 'ghost_wireframe',
        uniform: true,
      },
      confidence: 1.0,
      user_can_override: true,
      source: 'gesture',
    };
  }

  setTargetElement(element: HTMLElement): void {
    this.visualFeedback.setElement(element);
  }

  onHeadsetConfirm(callback: (contract: GestureContract) => void): void {
    this.bridge.onConfirm(callback);
  }

  destroy(): void {
    this.gestureRecognizer.destroy();
    this.visualFeedback.destroy();
    this.bridge.destroy();
  }
}

export function createXRGestureHapticController(
  targetElement?: HTMLElement,
  xrTargetOrigin?: string
): XRGestureHapticController {
  return new XRGestureHapticController(targetElement, xrTargetOrigin);
}
