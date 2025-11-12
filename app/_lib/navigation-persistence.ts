/**
 * Navigation Persistence Utilities
 * Handles media player state persistence across page navigation
 */

import { PlaybackState } from '@/src/entities/models/media';

export interface NavigationPersistenceConfig {
  enablePersistence: boolean;
  enableCrossTabSync: boolean;
  autoSaveInterval: number;
}

export class NavigationPersistenceManager {
  private static instance: NavigationPersistenceManager;
  private config: NavigationPersistenceConfig;
  private navigationListeners: Set<() => void> = new Set();
  private isNavigating = false;

  private constructor(config: NavigationPersistenceConfig) {
    this.config = config;
    this.setupNavigationListeners();
  }

  static getInstance(config?: NavigationPersistenceConfig): NavigationPersistenceManager {
    if (!NavigationPersistenceManager.instance && config) {
      NavigationPersistenceManager.instance = new NavigationPersistenceManager(config);
    }
    return NavigationPersistenceManager.instance;
  }

  private setupNavigationListeners(): void {
    if (typeof window === 'undefined') return;

    // Listen for Next.js route changes
    const handleRouteChangeStart = () => {
      this.isNavigating = true;
      this.notifyNavigationStart();
    };

    const handleRouteChangeComplete = () => {
      this.isNavigating = false;
      this.notifyNavigationComplete();
    };

    // Listen for browser navigation
    window.addEventListener('beforeunload', handleRouteChangeStart);
    window.addEventListener('popstate', handleRouteChangeStart);
    
    // Listen for page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.notifyNavigationStart();
      } else {
        this.notifyNavigationComplete();
      }
    });

    // Listen for focus/blur events
    window.addEventListener('blur', handleRouteChangeStart);
    window.addEventListener('focus', handleRouteChangeComplete);
  }

  private notifyNavigationStart(): void {
    this.navigationListeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Navigation start listener error:', error);
      }
    });
  }

  private notifyNavigationComplete(): void {
    // Delay to ensure DOM is ready
    setTimeout(() => {
      this.navigationListeners.forEach(listener => {
        try {
          listener();
        } catch (error) {
          console.error('Navigation complete listener error:', error);
        }
      });
    }, 100);
  }

  onNavigationStart(callback: () => void): () => void {
    this.navigationListeners.add(callback);
    return () => this.navigationListeners.delete(callback);
  }

  isCurrentlyNavigating(): boolean {
    return this.isNavigating;
  }

  /**
   * Save media state for navigation persistence
   */
  saveMediaStateForNavigation(state: PlaybackState): void {
    if (!this.config.enablePersistence) return;

    try {
      sessionStorage.setItem('media-player-navigation-state', JSON.stringify(state));
      sessionStorage.setItem('media-player-current-media-id', state.mediaId);
      
      if (state.isPlaying) {
        sessionStorage.setItem('media-player-continue-playback', 'true');
      }
    } catch (error) {
      console.error('Failed to save navigation state:', error);
    }
  }

  /**
   * Load media state from navigation persistence
   */
  loadMediaStateFromNavigation(): PlaybackState | null {
    if (!this.config.enablePersistence) return null;

    try {
      const stateJson = sessionStorage.getItem('media-player-navigation-state');
      if (stateJson) {
        return JSON.parse(stateJson) as PlaybackState;
      }
    } catch (error) {
      console.error('Failed to load navigation state:', error);
    }

    return null;
  }

  /**
   * Check if playback should continue after navigation
   */
  shouldContinuePlayback(): boolean {
    return sessionStorage.getItem('media-player-continue-playback') === 'true';
  }

  /**
   * Clear navigation persistence data
   */
  clearNavigationState(): void {
    sessionStorage.removeItem('media-player-navigation-state');
    sessionStorage.removeItem('media-player-current-media-id');
    sessionStorage.removeItem('media-player-continue-playback');
  }

  /**
   * Get current media ID from navigation persistence
   */
  getCurrentMediaId(): string | null {
    return sessionStorage.getItem('media-player-current-media-id');
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<NavigationPersistenceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.navigationListeners.clear();
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.notifyNavigationStart);
      window.removeEventListener('popstate', this.notifyNavigationStart);
      window.removeEventListener('blur', this.notifyNavigationStart);
      window.removeEventListener('focus', this.notifyNavigationComplete);
      document.removeEventListener('visibilitychange', this.notifyNavigationStart);
    }
  }
}

/**
 * Hook for using navigation persistence in components
 */
export function useNavigationPersistence() {
  const manager = NavigationPersistenceManager.getInstance();
  
  return {
    isNavigating: manager.isCurrentlyNavigating(),
    saveStateForNavigation: manager.saveMediaStateForNavigation.bind(manager),
    loadStateFromNavigation: manager.loadMediaStateFromNavigation.bind(manager),
    shouldContinuePlayback: manager.shouldContinuePlayback.bind(manager),
    clearNavigationState: manager.clearNavigationState.bind(manager),
    getCurrentMediaId: manager.getCurrentMediaId.bind(manager),
    onNavigationStart: manager.onNavigationStart.bind(manager)
  };
}