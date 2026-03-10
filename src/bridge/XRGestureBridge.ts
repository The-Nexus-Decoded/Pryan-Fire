// XR Gesture Bridge - Mobile → Headset Communication
// Based on spatial-ui-contract.md

import { GestureContract, GestureIntent, PreviewType, TIMING } from '../gesture/GestureTypes';

export type XRTarget = 'preview' | 'geometry_commit';

export interface XRGestureMessage {
  type: 'gesture_preview' | 'gesture_commit' | 'gesture_cancel';
  contract: GestureContract;
  timestamp: number;
  expiresAt: number;
}

export class XRGestureBridge {
  private targetOrigin: string = '*'; // Configure for production
  private previewQueue: GestureContract[] = [];
  private pendingConfirm: XRGestureMessage | null = null;
  private onHeadsetConfirm: ((contract: GestureContract) => void) | null = null;
  private confirmTimeout: ReturnType<typeof setTimeout> | null = null;

  // V1 Constraints
  private readonly maxQueue = TIMING.PREVIEW_QUEUE_MAX;
  private readonly confirmWindow = TIMING.GESTURE_TO_HEADSET_CONFIRM_MS;

  constructor(targetOrigin?: string) {
    if (targetOrigin) {
      this.targetOrigin = targetOrigin;
    }
  }

  // Send preview to headset
  sendPreview(contract: GestureContract): boolean {
    if (this.previewQueue.length >= this.maxQueue) {
      console.warn('[XRGestureBridge] Preview queue full');
      return false;
    }

    this.previewQueue.push(contract);

    const message: XRGestureMessage = {
      type: 'gesture_preview',
      contract,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.confirmWindow,
    };

    this.postMessage(message);
    
    // Set confirm timeout
    this.confirmTimeout = setTimeout(() => {
      if (this.pendingConfirm) {
        console.warn('[XRGestureBridge] Confirm timeout, canceling preview');
        this.cancelPreview(contract);
        this.pendingConfirm = null;
      }
    }, this.confirmWindow);

    this.pendingConfirm = message;
    return true;
  }

  // Commit geometry after user confirmation
  commit(contract: GestureContract): void {
    const message: XRGestureMessage = {
      type: 'gesture_commit',
      contract,
      timestamp: Date.now(),
      expiresAt: 0,
    };

    this.postMessage(message);
    this.clearQueue();
  }

  // Cancel pending preview
  cancelPreview(contract: GestureContract): void {
    const message: XRGestureMessage = {
      type: 'gesture_cancel',
      contract,
      timestamp: Date.now(),
      expiresAt: 0,
    };

    this.postMessage(message);
    this.removeFromQueue(contract);
    
    if (this.pendingConfirm?.contract === contract) {
      this.pendingConfirm = null;
      if (this.confirmTimeout) {
        clearTimeout(this.confirmTimeout);
      }
    }
  }

  // Handle headset confirmation response
  onConfirm(callback: (contract: GestureContract) => void): void {
    this.onHeadsetConfirm = callback;
  }

  // Message handler (call this when receiving from headset)
  handleMessage(event: MessageEvent): void {
    const data = event.data;
    
    if (data.type === 'gesture_confirm' && this.pendingConfirm) {
      if (this.confirmTimeout) {
        clearTimeout(this.confirmTimeout);
      }
      
      // Remove from queue
      this.removeFromQueue(this.pendingConfirm.contract);
      
      // Notify listener
      if (this.onHeadsetConfirm) {
        this.onHeadsetConfirm(this.pendingConfirm.contract);
      }
      
      this.pendingConfirm = null;
    }
  }

  private postMessage(message: XRGestureMessage): void {
    // In production, use XRSession or WebSocket
    // For now, post to parent frame
    if (window.parent !== window) {
      window.parent.postMessage(message, this.targetOrigin);
    }
    console.log('[XRGestureBridge]', message.type, message.contract.action);
  }

  private removeFromQueue(contract: GestureContract): void {
    this.previewQueue = this.previewQueue.filter(
      c => c.action !== contract.action || c.confidence !== contract.confidence
    );
  }

  private clearQueue(): void {
    this.previewQueue = [];
  }

  getQueueSize(): number {
    return this.previewQueue.length;
  }

  destroy(): void {
    if (this.confirmTimeout) {
      clearTimeout(this.confirmTimeout);
    }
    this.clearQueue();
    this.pendingConfirm = null;
  }
}

export function createXRGestureBridge(targetOrigin?: string): XRGestureBridge {
  return new XRGestureBridge(targetOrigin);
}
