// SpatialHintRenderer - V0.2 Spec
// Handles ambient modes: full, ambient, silent

import { AmbientMode, GestureType } from '../gesture/GestureTypes';

export interface HandleConfig {
  visible: boolean;
  opacity: number;
  pulseEnabled: boolean;
  glowOnHover: boolean;
}

export interface HintState {
  mode: AmbientMode;
  focusedHandle: GestureType | null;
  handles: Map<GestureType, HandleConfig>;
}

// Visual constants per ambient mode
const MODE_CONFIGS: Record<AmbientMode, { handleOpacity: number; pulseEnabled: boolean; glowOnHover: boolean }> = {
  full: {
    handleOpacity: 1.0,
    pulseEnabled: true,
    glowOnHover: true,
  },
  ambient: {
    handleOpacity: 0.4,
    pulseEnabled: true,
    glowOnHover: false,
  },
  silent: {
    handleOpacity: 0,
    pulseEnabled: false,
    glowOnHover: false,
  },
};

export class SpatialHintRenderer {
  private container: HTMLElement | null = null;
  private mode: AmbientMode = 'full';
  private handles: Map<GestureType, HTMLElement> = new Map();
  private focusedHandle: GestureType | null = null;
  private pulseAnimationId: number | null = null;
  private fadeTimeoutId: ReturnType<typeof setTimeout> | null = null;

  // All 8 handles from gesture map
  private readonly ALL_HANDLES: GestureType[] = ['tap', 'double_tap', 'long_press', 'drag_x', 'drag_y', 'drag_z', 'pinch', 'rotate'];

  initialize(container: HTMLElement): void {
    this.container = container;
    this.createHandles();
    this.applyMode(this.mode);
  }

  private createHandles(): void {
    if (!this.container) return;

    // Clear existing
    this.container.innerHTML = '';
    this.handles.clear();

    this.ALL_HANDLES.forEach(gesture => {
      const handle = document.createElement('div');
      handle.className = `spatial-handle spatial-handle--${gesture}`;
      handle.dataset.gesture = gesture;
      handle.style.cssText = this.getHandleStyle(gesture, 1.0);
      
      // Hover events for full mode
      handle.addEventListener('mouseenter', () => this.onHandleHover(gesture));
      handle.addEventListener('mouseleave', () => this.onHandleLeave(gesture));
      
      this.container!.appendChild(handle);
      this.handles.set(gesture, handle);
    });
  }

  private getHandleStyle(gesture: GestureType, opacity: number): string {
    const config = MODE_CONFIGS[this.mode];
    const finalOpacity = opacity * config.handleOpacity;
    
    // Handle positioning - arrange in arc around selection point
    const positions: Record<GestureType, { x: string; y: string }> = {
      tap: { x: '50%', y: '30%' },
      double_tap: { x: '30%', y: '40%' },
      long_press: { x: '70%', y: '40%' },
      drag_x: { x: '20%', y: '60%' },
      drag_y: { x: '80%', y: '60%' },
      drag_z: { x: '50%', y: '80%' },
      pinch: { x: '25%', y: '75%' },
      rotate: { x: '75%', y: '75%' },
    };

    const pos = positions[gesture];
    
    return `
      position: absolute;
      left: ${pos.x};
      top: ${pos.y};
      transform: translate(-50%, -50%);
      width: 48px;
      height: 48px;
      opacity: ${finalOpacity};
      transition: opacity 0.3s ease, transform 0.2s ease;
      pointer-events: ${this.mode === 'silent' ? 'none' : 'auto'};
    `;
  }

  setMode(mode: AmbientMode): void {
    const oldMode = this.mode;
    this.mode = mode;
    this.applyMode(mode);

    // Silent mode: fade out handles, set tap-to-reveal
    if (mode === 'silent') {
      this.scheduleFadeReveal();
    }

    // Stop pulses in silent mode
    if (mode === 'silent') {
      this.stopPulse();
    } else if (oldMode === 'silent') {
      this.startPulse();
    }
  }

  private applyMode(mode: AmbientMode): void {
    const config = MODE_CONFIGS[mode];
    
    this.handles.forEach((handle, gesture) => {
      const isFocused = this.focusedHandle === gesture;
      const opacity = isFocused ? 1.0 : config.handleOpacity;
      handle.style.opacity = String(opacity);
      handle.style.pointerEvents = mode === 'silent' ? 'none' : 'auto';
    });
  }

  private onHandleHover(gesture: GestureType): void {
    if (this.mode !== 'full') return;
    
    this.focusedHandle = gesture;
    const handle = this.handles.get(gesture);
    if (handle) {
      handle.style.transform = 'translate(-50%, -50%) scale(1.2)';
      handle.style.boxShadow = '0 0 20px cyan';
    }
  }

  private onHandleLeave(gesture: GestureType): void {
    this.focusedHandle = null;
    const handle = this.handles.get(gesture);
    if (handle) {
      handle.style.transform = 'translate(-50%, -50%) scale(1)';
      handle.style.boxShadow = 'none';
    }
  }

  private scheduleFadeReveal(): void {
    // In silent mode: tap-to-reveal with 3s fade
    if (this.fadeTimeoutId) {
      clearTimeout(this.fadeTimeoutId);
    }

    // For silent mode, handles are hidden but become visible on interaction
    this.handles.forEach(handle => {
      handle.style.transition = 'opacity 3s ease';
      handle.style.opacity = '0';
    });
  }

  reveal(): void {
    if (this.mode !== 'silent') return;
    
    this.handles.forEach(handle => {
      handle.style.opacity = '1';
    });

    // Auto-hide after 5 seconds
    this.fadeTimeoutId = setTimeout(() => {
      this.handles.forEach(handle => {
        handle.style.opacity = '0';
      });
    }, 5000);
  }

  private startPulse(): void {
    if (this.mode === 'silent') return;
    
    let phase = 0;
    const pulse = () => {
      if (this.mode === 'silent') return;
      
      phase = (phase + 0.05) % (Math.PI * 2);
      const pulseValue = 0.8 + Math.sin(phase) * 0.2;
      
      this.handles.forEach((handle, gesture) => {
        if (this.focusedHandle !== gesture) {
          handle.style.opacity = String(MODE_CONFIGS[this.mode].handleOpacity * pulseValue);
        }
      });
      
      this.pulseAnimationId = requestAnimationFrame(pulse);
    };
    
    pulse();
  }

  private stopPulse(): void {
    if (this.pulseAnimationId !== null) {
      cancelAnimationFrame(this.pulseAnimationId);
      this.pulseAnimationId = null;
    }
  }

  getMode(): AmbientMode {
    return this.mode;
  }

  destroy(): void {
    this.stopPulse();
    if (this.fadeTimeoutId) {
      clearTimeout(this.fadeTimeoutId);
    }
    this.handles.clear();
    this.container = null;
  }
}

export function createSpatialHintRenderer(): SpatialHintRenderer {
  return new SpatialHintRenderer();
}
