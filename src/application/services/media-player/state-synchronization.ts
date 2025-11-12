/**
 * State Synchronization Service
 * Single Responsibility: Handle cross-tab state synchronization using BroadcastChannel
 * Implements IStateSynchronization interface
 */

import { PlaybackState } from '@/src/entities/models/media';
import { IStateSynchronization } from '@/src/entities/models/media-player';

interface SyncMessage {
  type: 'STATE_CHANGE' | 'STATE_REQUEST' | 'STATE_RESPONSE';
  payload: PlaybackState | null;
  timestamp: number;
  tabId: string;
}

export class StateSynchronization implements IStateSynchronization {
  private readonly channelName = 'edu-pwa-media-sync';
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(state: PlaybackState) => void> = new Set();
  private tabId: string;
  private isEnabled = true;

  constructor() {
    this.tabId = this.generateTabId();
    this.initChannel();
  }

  private generateTabId(): string {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initChannel(): void {
    try {
      // Check if BroadcastChannel is supported
      if (typeof BroadcastChannel === 'undefined') {
        console.warn('BroadcastChannel not supported, cross-tab sync disabled');
        this.isEnabled = false;
        return;
      }

      this.channel = new BroadcastChannel(this.channelName);
      this.channel.addEventListener('message', this.handleMessage.bind(this));
      
      // Handle channel errors
      this.channel.addEventListener('messageerror', (event) => {
        console.error('BroadcastChannel message error:', event);
      });

    } catch (error) {
      console.error('Failed to initialize BroadcastChannel:', error);
      this.isEnabled = false;
    }
  }

  private handleMessage(event: MessageEvent<SyncMessage>): void {
    try {
      const message = event.data;
      
      // Ignore messages from the same tab
      if (message.tabId === this.tabId) {
        return;
      }

      // Validate message structure
      if (!this.isValidMessage(message)) {
        console.warn('Invalid sync message received:', message);
        return;
      }

      switch (message.type) {
        case 'STATE_CHANGE':
          if (message.payload) {
            this.notifyListeners(message.payload);
          }
          break;
          
        case 'STATE_REQUEST':
          // Other tabs can request current state (for new tab initialization)
          // This would be handled by the PlaybackStateManager
          break;
          
        case 'STATE_RESPONSE':
          if (message.payload) {
            this.notifyListeners(message.payload);
          }
          break;
          
        default:
          console.warn('Unknown sync message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling sync message:', error);
    }
  }

  private isValidMessage(message: any): message is SyncMessage {
    return (
      message &&
      typeof message === 'object' &&
      typeof message.type === 'string' &&
      typeof message.timestamp === 'number' &&
      typeof message.tabId === 'string' &&
      ['STATE_CHANGE', 'STATE_REQUEST', 'STATE_RESPONSE'].includes(message.type)
    );
  }

  private notifyListeners(state: PlaybackState): void {
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('Error in state change listener:', error);
      }
    });
  }

  broadcastStateChange(state: PlaybackState): void {
    if (!this.isEnabled || !this.channel) {
      return;
    }

    try {
      const message: SyncMessage = {
        type: 'STATE_CHANGE',
        payload: state,
        timestamp: Date.now(),
        tabId: this.tabId
      };

      this.channel.postMessage(message);
    } catch (error) {
      console.error('Failed to broadcast state change:', error);
    }
  }

  onStateChange(callback: (state: PlaybackState) => void): void {
    this.listeners.add(callback);
  }

  removeStateChangeListener(callback: (state: PlaybackState) => void): void {
    this.listeners.delete(callback);
  }

  async syncWithOtherTabs(): Promise<void> {
    if (!this.isEnabled || !this.channel) {
      return;
    }

    try {
      // Request current state from other tabs
      const message: SyncMessage = {
        type: 'STATE_REQUEST',
        payload: null,
        timestamp: Date.now(),
        tabId: this.tabId
      };

      this.channel.postMessage(message);
      
      // Note: Response handling would be implemented in PlaybackStateManager
      // which has access to the current state
    } catch (error) {
      console.error('Failed to sync with other tabs:', error);
    }
  }

  /**
   * Respond to state requests from other tabs
   */
  respondToStateRequest(currentState: PlaybackState | null): void {
    if (!this.isEnabled || !this.channel || !currentState) {
      return;
    }

    try {
      const message: SyncMessage = {
        type: 'STATE_RESPONSE',
        payload: currentState,
        timestamp: Date.now(),
        tabId: this.tabId
      };

      this.channel.postMessage(message);
    } catch (error) {
      console.error('Failed to respond to state request:', error);
    }
  }

  cleanup(): void {
    if (this.channel) {
      try {
        this.channel.close();
      } catch (error) {
        console.error('Error closing BroadcastChannel:', error);
      }
      this.channel = null;
    }
    
    this.listeners.clear();
    this.isEnabled = false;
  }

  /**
   * Check if cross-tab sync is available and enabled
   */
  isAvailable(): boolean {
    return this.isEnabled && this.channel !== null;
  }

  /**
   * Get sync statistics for monitoring
   */
  getStats(): { isEnabled: boolean; listenerCount: number; tabId: string } {
    return {
      isEnabled: this.isEnabled,
      listenerCount: this.listeners.size,
      tabId: this.tabId
    };
  }
}