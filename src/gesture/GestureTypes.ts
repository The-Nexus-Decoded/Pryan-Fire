// Gesture Types - V1 Contract Schema
// Based on spatial-ui-contract.md

export type GestureIntent = 'move' | 'rotate' | 'scale';
export type PreviewType = 'ghost_wireframe' | 'rotation_ring' | 'corner_handles';

export interface GestureContract {
  intent: 'manipulate';
  action: GestureIntent;
  axis?: 'x' | 'y';
  method: 'dual_trigger' | 'dual_grip' | 'touch_drag';
  preview: {
    type: PreviewType;
    uniform: boolean;
  };
  confidence: number; // 0.0-1.0
  user_can_override: boolean;
  source: 'menu' | 'gesture';
}

// Gesture Event Types
export interface GestureEvent {
  gesture: 'double_tap' | 'rotate' | 'long_press';
  intent: GestureIntent;
  timestamp: number;
  confidence: number;
}

// Timing Constants (V1)
export const TIMING = {
  GESTURE_TO_HEADSET_CONFIRM_MS: 2000,
  DOUBLE_TAP_INTERVAL_MAX_MS: 300,
  LONG_PRESS_THRESHOLD_MS: 500,
  PREVIEW_QUEUE_MAX: 3,
} as const;

// World Unit Baseline (V1/V2 Shared)
export const WORLD_UNITS = {
  REFERENCE_DISTANCE_M: 1,
  FOV_DEGREES: 90,
  VISIBLE_WIDTH_AT_1M: 2 * Math.tan((90 / 2) * (Math.PI / 180)), // ~2m
  PIXELS_PER_WORLD_UNIT: 960, // 1920px canvas / 2m
  MIN_TOUCH_TARGET_PX: 44,
} as const;
