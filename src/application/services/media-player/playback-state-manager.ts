/**
 * Playback State Manager
 * Single Responsibility: Orchestrate playback state persistence and synchronization
 * Coordinates between persistence layer and cross-tab synchronization
 */

import { PlaybackState } from '@/src/entities/models/media';
import { IPlaybackStateManager, IPlaybackPersistence, IStateSynchronization } from '@/src/entities/models/media-player';
import { PlaybackPersistence } from './playback-persistence';
import { StateSynchronization } from './state-synchronization';

export class PlaybackStateManager implements IPlaybackStateManager {
  private persistence: IPlaybackPersistence;
  private synchronization: IStateSynchronization;
  private autoSaveInterval: NodeJS.Timeout | null = null;
  private stateRestoredListeners: Set<(state: PlaybackState) => void> = new Set();
  private crossTabSyncEnabled = true;
  private currentState: PlaybackState | null = null;

  constructor(
    persistence?: IPlaybackPersistence,
    synchronization?: IStateSynchronization
  ) {
    this.persistence = persistence || new PlaybackPersistence();
    this.synchronization = synchronization || new StateSynchronization();
    
    this.initializeSynchronization();
  }

  private initializeSynchronization(): void {
    // Listen for state changes from other tabs
    this.synchronization.onStateChange((state: PlaybackState) => {
      if (this.crossTabSyncEnabled) {
        this.handleExternalStateChange(state);
      }
    });

    // Handle state requests from other tabs
    this.setupStateRequestHandling();
  }

  private setupStateRequestHandling(): void {
    // This would be enhanced to handle STATE_REQUEST messages
    // For now, we'll implement basic cross-tab sync
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.cleanup();
      });
    }
  }

  private handleExternalStateChange(state: PlaybackState): void {
    // Update current state if it's for the same media
    if (this.currentState && this.currentState.mediaId === state.mediaId) {
      // Only update if the external state is newer
      if (state.lastUpdated > this.currentState.lastUpdated) {
        this.currentState = state;
        this.notifyStateRestored(state);
      }
    }
  }

  private notifyStateRestored(state: PlaybackState): void {
    this.stateRestoredListeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('Error in state restored listener:', error);
      }
    });
  }

  async saveState(state: PlaybackState): Promise<void> {
    try {
      // Update current state
      this.currentState = state;
      
      // Save to persistent storage
      await this.persistence.saveState(state);
      
      // Broadcast to other tabs if sync is enabled
      if (this.crossTabSyncEnabled) {
        this.synchronization.broadcastStateChange(state);
      }
    } catch (error) {
      console.error('Failed to save playback state:', error);
      throw error;
    }
  }

  async loadState(mediaId: string): Promise<PlaybackState | null> {
    try {
      const state = await this.persistence.loadState(mediaId);
      
      if (state) {
        this.currentState = state;
        
        // Sync with other tabs to get the most recent state
        if (this.crossTabSyncEnabled) {
          await this.synchronization.syncWithOtherTabs();
        }
      }
      
      return state;
    } catch (error) {
      console.error('Failed to load playback state:', error);
      return null;
    }
  }

  async clearState(mediaId: string): Promise<void> {
    try {
      await this.persistence.clearState(mediaId);
      
      // Clear current state if it matches
      if (this.currentState && this.currentState.mediaId === mediaId) {
        this.currentState = null;
      }
      
      // Broadcast clear to other tabs
      if (this.crossTabSyncEnabled) {
        const clearState: PlaybackState = {
          mediaId,
          currentTime: 0,
          duration: 0,
          volume: 1,
          playbackRate: 1,
          isPlaying: false,
          lastUpdated: new Date()
        };
        this.synchronization.broadcastStateChange(clearState);
      }
    } catch (error) {
      console.error('Failed to clear playback state:', error);
    }
  }

  async getAllStates(): Promise<PlaybackState[]> {
    try {
      return await this.persistence.getAllStates();
    } catch (error) {
      console.error('Failed to get all playback states:', error);
      return [];
    }
  }

  startAutoSave(getState: () => PlaybackState, intervalMs: number = 5000): void {
    this.stopAutoSave();

    this.autoSaveInterval = setInterval(async () => {
      try {
        const state = getState();
        
        // Only save if state has meaningful changes
        if (this.shouldSaveState(state)) {
          await this.saveState(state);
        }
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, intervalMs);
  }

  private shouldSaveState(state: PlaybackState): boolean {
    if (!this.currentState) {
      return true;
    }

    // Save if significant changes occurred
    const timeDiff = Math.abs(state.currentTime - this.currentState.currentTime);
    const playingChanged = state.isPlaying !== this.currentState.isPlaying;
    const volumeChanged = state.volume !== this.currentState.volume;
    const rateChanged = state.playbackRate !== this.currentState.playbackRate;

    return timeDiff > 1 || playingChanged || volumeChanged || rateChanged;
  }

  stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  enableCrossTabSync(enabled: boolean): void {
    this.crossTabSyncEnabled = enabled;
  }

  onStateRestored(callback: (state: PlaybackState) => void): void {
    this.stateRestoredListeners.add(callback);
  }

  removeStateRestoredListener(callback: (state: PlaybackState) => void): void {
    this.stateRestoredListeners.delete(callback);
  }

  /**
   * Restore state on app restart or page navigation
   */
  async restoreStateOnNavigation(mediaId: string): Promise<PlaybackState | null> {
    try {
      const state = await this.loadState(mediaId);
      
      if (state) {
        this.notifyStateRestored(state);
      }
      
      return state;
    } catch (error) {
      console.error('Failed to restore state on navigation:', error);
      return null;
    }
  }

  /**
   * Get current state for synchronization
   */
  getCurrentState(): PlaybackState | null {
    return this.currentState;
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    this.stopAutoSave();
    
    // Cleanup synchronization
    if (this.synchronization) {
      this.synchronization.cleanup();
    }
    
    // Clear all listeners
    this.stateRestoredListeners.clear();
    
    // Clear current state
    this.currentState = null;
  }

  /**
   * Close and cleanup all resources
   */
  async close(): Promise<void> {
    console.log('[PlaybackStateManager] Closing and cleaning up');
    
    // Stop auto-save first
    this.stopAutoSave();
    
    // Cleanup synchronization
    this.cleanup();
    
    // Close persistence layer
    if (this.persistence) {
      await this.persistence.close();
    }
    
    console.log('[PlaybackStateManager] Cleanup complete');
  }

  /**
   * Export states for backup/migration
   */
  async exportStates(): Promise<PlaybackState[]> {
    return await this.persistence.exportStates();
  }

  /**
   * Import states for restore/migration
   */
  async importStates(states: PlaybackState[]): Promise<void> {
    await this.persistence.importStates(states);
  }

  /**
   * Cleanup old states
   */
  async cleanupOldStates(daysOld: number = 30): Promise<void> {
    await this.persistence.cleanupOldStates(daysOld);
  }

  /**
   * Get manager statistics
   */
  getStats(): {
    persistence: any;
    synchronization: any;
    autoSaveActive: boolean;
    crossTabSyncEnabled: boolean;
    currentStateExists: boolean;
  } {
    return {
      persistence: this.persistence instanceof PlaybackPersistence ? 
        (this.persistence as any).getStats?.() : null,
      synchronization: this.synchronization instanceof StateSynchronization ? 
        (this.synchronization as any).getStats?.() : null,
      autoSaveActive: this.autoSaveInterval !== null,
      crossTabSyncEnabled: this.crossTabSyncEnabled,
      currentStateExists: this.currentState !== null
    };
  }
}
