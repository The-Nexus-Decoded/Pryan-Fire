# XR Gesture-Haptic Prototype

V1 implementation based on `spatial-ui-contract.md` and `ambient-skin-spec.md`

## Gesture-Haptic System

### Core Components

| Module | Purpose |
| ------ | ---------|
| `GestureRecognizer` | Detects double-tap, rotate, long-press |
| `VisualFeedback` | Cyan glow, scale pulse, red shake |
| `HapticEngine` | Vibration patterns per spec |
| `XRGestureBridge` | Mobile → Headset communication |

### Timing Constraints (V1)

| Parameter | Value |
| --------- | ----- |
| Gesture → Headset confirm | 2s max |
| Double-tap interval | 300ms max |
| Long-press threshold | 500ms |

### Haptic Patterns (V1)

| Event | Pattern | Intensity |
| ------ | --------| ---------- |
| Intent sent (double-tap) | Single 35ms pulse | Medium |
| Confirmed (rotate) | Double 50ms pulse, 80ms gap | High |
| Error (long-press) | Triple 40ms pulse, 50ms gaps | High |

### File Structure

```
src/
├── gesture/
│   ├── GestureRecognizer.ts    # Double-tap, rotate, long-press detection
│   ├── GestureTypes.ts          # Intent/action types per contract
│   └── index.ts
├── haptics/
│   ├── HapticEngine.ts          # Vibration pattern player
│   ├── patterns.ts              # Pattern definitions
│   └── index.ts
├── visual/
│   ├── VisualFeedback.ts        # Glow, scale pulse, shake animations
│   └── index.ts
├── bridge/
│   └── XRGestureBridge.ts       # Mobile → XR communication
└── index.ts                     # Main export
```
