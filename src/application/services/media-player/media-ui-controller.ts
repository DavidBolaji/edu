/**
 * Media UI Controller
 * Single Responsibility: Manage UI state and visual presentation of media player
 */

import {
  IMediaUIController,
  MediaViewMode,
  MediaPlayerError
} from '@/src/entities/models/media-player';
import { EventListenerManager } from './resource-manager';

export class MediaUIController implements IMediaUIController {
  private viewMode: MediaViewMode = MediaViewMode.FULL;
  private controlsVisible = true;
  private isLoading = false;
  private currentError: MediaPlayerError | null = null;
  private controlsTimeout: NodeJS.Timeout | null = null;
  private onStateChangeCallback: (() => void) | null = null;
  private eventManager: EventListenerManager = new EventListenerManager();

  constructor(private container: HTMLElement) {}

  setMinimized(minimized: boolean): void {
    if (minimized) {
      this.viewMode = MediaViewMode.MINI;
      this.applyMiniPlayerStyles();
    } else {
      this.viewMode = MediaViewMode.FULL;
      this.applyFullPlayerStyles();
    }
    this.notifyStateChange();
  }

  async setPictureInPicture(enabled: boolean): Promise<void> {
    if (enabled) {
      this.viewMode = MediaViewMode.PICTURE_IN_PICTURE;
    } else if (this.viewMode === MediaViewMode.PICTURE_IN_PICTURE) {
      this.viewMode = MediaViewMode.FULL;
    }
    this.notifyStateChange();
  }

  showControls(show: boolean): void {
    this.controlsVisible = show;
    this.updateControlsVisibility();
    
    if (show) {
      this.startControlsAutoHide();
    } else {
      this.stopControlsAutoHide();
    }
    
    this.notifyStateChange();
  }

  updateProgress(current: number, duration: number): void {
    const progressBar = this.container.querySelector('[data-progress-bar]') as HTMLElement;
    const currentTimeDisplay = this.container.querySelector('[data-current-time]') as HTMLElement;
    const durationDisplay = this.container.querySelector('[data-duration]') as HTMLElement;

    if (progressBar && duration > 0) {
      const percentage = (current / duration) * 100;
      progressBar.style.width = `${percentage}%`;
    }

    if (currentTimeDisplay) {
      currentTimeDisplay.textContent = this.formatTime(current);
    }

    if (durationDisplay) {
      durationDisplay.textContent = this.formatTime(duration);
    }
  }

  setLoading(loading: boolean): void {
    this.isLoading = loading;
    this.updateLoadingState();
    this.notifyStateChange();
  }

  setError(error: MediaPlayerError | null): void {
    this.currentError = error;
    this.updateErrorState();
    this.notifyStateChange();
  }

  getViewMode(): MediaViewMode {
    return this.viewMode;
  }

  /**
   * Check if controls are currently visible
   */
  areControlsVisible(): boolean {
    return this.controlsVisible;
  }

  /**
   * Check if player is in loading state
   */
  isPlayerLoading(): boolean {
    return this.isLoading;
  }

  /**
   * Get current error if any
   */
  getCurrentError(): MediaPlayerError | null {
    return this.currentError;
  }

  /**
   * Register callback for state changes
   */
  onStateChange(callback: () => void): void {
    this.onStateChangeCallback = callback;
  }

  /**
   * Hide the player completely
   */
  hide(): void {
    this.viewMode = MediaViewMode.HIDDEN;
    this.container.style.display = 'none';
    this.notifyStateChange();
  }

  /**
   * Show the player
   */
  show(): void {
    if (this.viewMode === MediaViewMode.HIDDEN) {
      this.viewMode = MediaViewMode.FULL;
    }
    this.container.style.display = '';
    this.notifyStateChange();
  }

  /**
   * Toggle fullscreen mode
   */
  async toggleFullscreen(): Promise<void> {
    if (!document.fullscreenElement) {
      await this.container.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.stopControlsAutoHide();
    
    // Cleanup event listeners
    this.eventManager.cleanup();
    
    this.onStateChangeCallback = null;
  }

  private applyFullPlayerStyles(): void {
    this.container.classList.remove('mini-player');
    this.container.classList.add('full-player');
    this.container.style.position = '';
    this.container.style.bottom = '';
    this.container.style.right = '';
    this.container.style.width = '';
    this.container.style.height = '';
    this.container.style.zIndex = '';
  }

  private applyMiniPlayerStyles(): void {
    this.container.classList.remove('full-player');
    this.container.classList.add('mini-player');
    this.container.style.position = 'fixed';
    this.container.style.bottom = '20px';
    this.container.style.right = '20px';
    this.container.style.width = '320px';
    this.container.style.height = '180px';
    this.container.style.zIndex = '9999';
    this.container.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    this.container.style.borderRadius = '8px';
    this.container.style.overflow = 'hidden';
  }

  private updateControlsVisibility(): void {
    const controls = this.container.querySelector('[data-controls]') as HTMLElement;
    
    if (controls) {
      controls.style.opacity = this.controlsVisible ? '1' : '0';
      controls.style.pointerEvents = this.controlsVisible ? 'auto' : 'none';
      controls.style.transition = 'opacity 0.3s ease';
    }
  }

  private startControlsAutoHide(): void {
    this.stopControlsAutoHide();
    
    // Auto-hide controls after 3 seconds of inactivity
    this.controlsTimeout = setTimeout(() => {
      if (this.viewMode === MediaViewMode.FULL) {
        this.showControls(false);
      }
    }, 3000);
  }

  private stopControlsAutoHide(): void {
    if (this.controlsTimeout) {
      clearTimeout(this.controlsTimeout);
      this.controlsTimeout = null;
    }
  }

  private updateLoadingState(): void {
    const loadingIndicator = this.container.querySelector('[data-loading]') as HTMLElement;
    
    if (loadingIndicator) {
      loadingIndicator.style.display = this.isLoading ? 'flex' : 'none';
    }
  }

  private updateErrorState(): void {
    const errorDisplay = this.container.querySelector('[data-error]') as HTMLElement;
    const errorMessage = this.container.querySelector('[data-error-message]') as HTMLElement;
    
    if (errorDisplay) {
      errorDisplay.style.display = this.currentError ? 'flex' : 'none';
    }

    if (errorMessage && this.currentError) {
      errorMessage.textContent = this.currentError.message;
    }
  }

  private formatTime(seconds: number): string {
    // Handle invalid values (NaN, Infinity, negative)
    if (!isFinite(seconds) || seconds < 0 || isNaN(seconds)) {
      return '--:--';
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  private notifyStateChange(): void {
    this.onStateChangeCallback?.();
  }
}
