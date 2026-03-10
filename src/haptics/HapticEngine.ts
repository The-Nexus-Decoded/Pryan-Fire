// Haptic Patterns - V0.2 Spec
// Based on spatial-ui-contract.md

import { HapticFeedback } from '../gesture/GestureTypes';

export type HapticEvent = 'intent_sent' | 'confirmed' | 'error';

export interface HapticPattern {
  pulses: number[]; // [duration_ms, gap_ms, duration_ms, ...]
  intensity: 'low' | 'medium' | 'high';
}

// V0.2 Haptic Patterns (from gesture map)
export const HAPTIC_PATTERNS: Record<HapticFeedback, HapticPattern> = {
  // tap → select → light
  light: {
    pulses: [20],
    intensity: 'low',
  },
  // double_tap → confirm → double
  double: {
    pulses: [30, 60, 30],
    intensity: 'medium',
  },
  // long_press → context → heavy
  heavy: {
    pulses: [80],
    intensity: 'high',
  },
  // drag_x/y → translate → soft
  soft: {
    pulses: [15],
    intensity: 'low',
  },
  // drag_z/pinch/rotate → medium
  medium: {
    pulses: [40],
    intensity: 'medium',
  },
};

// Legacy V1 patterns (backward compatibility)
export const LEGACY_HAPTIC_PATTERNS: Record<HapticEvent, HapticPattern> = {
  // Intent sent (double-tap) - Single 35ms pulse, Medium
  intent_sent: {
    pulses: [35],
    intensity: 'medium',
  },
  // Confirmed (rotate) - Double 50ms pulse, 80ms gap, High
  confirmed: {
    pulses: [50, 80, 50],
    intensity: 'high',
  },
  // Error (long-press) - Triple 40ms pulse, 50ms gaps, High
  error: {
    pulses: [40, 50, 40, 50, 40],
    intensity: 'high',
  },
};

// Intensity to vibration amplitude mapping (0-255)
const INTENSITY_MAP = {
  low: 64,
  medium: 128,
  high: 200,
} as const;

export class HapticEngine {
  private vibrate: (pattern: number[]) => void;
  private isSupported: boolean;

  constructor() {
    // Check for Web Vibration API
    this.isSupported = 'vibrate' in navigator;
    this.vibrate = (pattern: number[]) => {
      if (this.isSupported) {
        navigator.vibrate(pattern);
      }
    };
  }

  // V0.2: Play haptic by gesture feedback type (light, double, heavy, soft, medium)
  playFeedback(feedback: HapticFeedback): void {
    const pattern = HAPTIC_PATTERNS[feedback];
    if (!pattern) {
      console.warn(`[HapticEngine] Unknown feedback: ${feedback}`);
      return;
    }
    this.vibrate(pattern.pulses);
  }

  // Legacy V1: Play haptic by event type (backward compatibility)
  play(event: HapticEvent): void {
    const pattern = LEGACY_HAPTIC_PATTERNS[event];
    if (!pattern) {
      console.warn(`[HapticEngine] Unknown event: ${event}`);
      return;
    }
    this.vibrate(pattern.pulses);
  }

  playCustom(pulses: number[], intensity: 'low' | 'medium' | 'high'): void {
    this.vibrate(pulses);
  }

  cancel(): void {
    if (this.isSupported) {
      navigator.vibrate(0);
    }
  }

  getSupported(): boolean {
    return this.isSupported;
  }
}

// Factory
export function createHapticEngine(): HapticEngine {
  return new HapticEngine();
}
