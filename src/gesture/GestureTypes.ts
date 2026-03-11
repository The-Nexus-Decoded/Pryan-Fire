// Gesture Types - V0.2 Contract Schema
// Based on spatial-ui-contract.md (V0.2)

export type GestureType = 
  | 'tap' 
  | 'double_tap' 
  | 'long_press' 
  | 'drag_x' 
  | 'drag_y' 
  | 'drag_z' 
  | 'pinch' 
  | 'rotate';

export type GestureIntent = 'select' | 'confirm' | 'context' | 'translate' | 'scale' | 'rotate';
export type PreviewType = 'ghost_wireframe' | 'rotation_ring' | 'corner_handles' | 'depth_handle';
export type HapticFeedback = 'light' | 'double' | 'heavy' | 'soft' | 'medium';

export type AmbientMode = 'full' | 'ambient' | 'silent';

export interface GestureContract {
  intent: 'manipulate';
  action: GestureIntent;
  axis?: 'x' | 'y' | 'z';
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
  gesture: GestureType;
  intent: GestureIntent;
  timestamp: number;
  confidence: number;
  delta?: { x: number; y: number; z?: number };
  scale?: number;
}

// V0.2 Gesture Map
export interface GestureSpec {
  gesture: GestureType;
  input: string;
  threshold: string;
  output: GestureIntent;
  haptic: HapticFeedback;
  minConfidence: number;
}

export const GESTURE_MAP: GestureSpec[] = [
  { gesture: 'tap', input: 'touch start/end', threshold: '<200ms', output: 'select', haptic: 'light', minConfidence: 0.5 },
  { gesture: 'double_tap', input: 'two taps', threshold: 'gap <300ms', output: 'confirm', haptic: 'double', minConfidence: 0.7 },
  { gesture: 'long_press', input: 'touch held', threshold: '>500ms', output: 'context', haptic: 'heavy', minConfidence: 0.8 },
  { gesture: 'drag_x', input: 'horizontal swipe', threshold: '>30px', output: 'translate', haptic: 'soft', minConfidence: 0.6 },
  { gesture: 'drag_y', input: 'vertical swipe', threshold: '>30px', output: 'translate', haptic: 'soft', minConfidence: 0.6 },
  { gesture: 'drag_z', input: 'depth handle (Sartan)', threshold: '0.85 conf', output: 'translate', haptic: 'medium', minConfidence: 0.85 },
  { gesture: 'pinch', input: 'two-finger', threshold: 'scale delta', output: 'scale', haptic: 'medium', minConfidence: 0.7 },
  { gesture: 'rotate', input: 'two-finger twist', threshold: '>15°', output: 'rotate', haptic: 'medium', minConfidence: 0.7 },
];

// Confidence threshold for mobile commit vs queue split
export const CONFIDENCE_THRESHOLD = 0.85;

// Timing constants per xr-gesture-haptics-proto.md V1
export const TIMING = {
  DOUBLE_TAP_INTERVAL_MAX_MS: 300,
  LONG_PRESS_THRESHOLD_MS: 500,
  PREVIEW_QUEUE_MAX: 3,
  GESTURE_TO_HEADSET_CONFIRM_MS: 2000,
} as const;
