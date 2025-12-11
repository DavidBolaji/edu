/**
 * Media Player Core
 * Orchestrates all media player controllers following Single Responsibility Principle
 * Delegates specific responsibilities to specialized controllers
 */

import { MediaItem, PlaybackState } from '@/src/entities/models/media';
import {
  IMediaPlayer,
  IMediaState,
  IMediaHandler,
  MediaPlayerConfig,
  MediaPlayerError,
  MediaErrorCode
} from '@/src/entities/models/media-player';
import { AudioController } from './audio-controller';
import { VideoController } from './video-controller';
import { EbookController } from './ebook-controller';
import { PlaybackStateManager } from './playback-state-manager';
import { MediaUIController } from './media-ui-controller';
import { ResourceManager, MediaElementPool } from './resource-manager';

export class MediaPlayerCore implements IMediaPlayer {
  private currentMedia: MediaItem | null = null;
  private currentHandler: IMediaHandler | null = null;
  private handlers: Map<string, IMediaHandler> = new Map();
  private stateManager: PlaybackStateManager;
  private uiController: MediaUIController;
  private config: MediaPlayerConfig;
  private resourceManager: ResourceManager;
  private mediaPool: MediaElementPool;
  
  private state: IMediaState = {
    currentMedia: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    playbackRate: 1,
    isMinimized: false,
    isPictureInPicture: false,
    error: null
  };

  constructor(
    private container: HTMLElement,
    config: Partial<MediaPlayerConfig> = {}
  ) {
    this.config = {
      autoSaveInterval: config.autoSaveInterval ?? 5000,
      enablePictureInPicture: config.enablePictureInPicture ?? true,
      enableMiniPlayer: config.enableMiniPlayer ?? true,
      defaultVolume: config.defaultVolume ?? 1,
      defaultPlaybackRate: config.defaultPlaybackRate ?? 1
    };

    // Initialize resource management
    this.resourceManager = new ResourceManager();
    this.mediaPool = new MediaElementPool(3);

    // Initialize controllers
    this.stateManager = new PlaybackStateManager();
    this.uiController = new MediaUIController(container);
    
    // Register media handlers
    this.registerHandlers();
    
    // Set default state
    this.state.volume = this.config.defaultVolume ?? 1;
    this.state.playbackRate = this.config.defaultPlaybackRate ?? 1;

    // Register container for cleanup
    this.resourceManager.registerResource('container', {
      type: 'element',
      resource: container,
      cleanup: () => {
        // Container cleanup is handled by parent
      },
      createdAt: new Date()
    });
  }

  async load(media: MediaItem): Promise<void> {
    try {
      this.uiController.setLoading(true);
      this.uiController.setError(null);

      // Stop current playback if any
      if (this.currentHandler) {
        this.currentHandler.stop();
      }

      // Select appropriate handler
      const handler = this.selectHandler(media.type);
      if (!handler) {
        throw this.createError(
          MediaErrorCode.UNSUPPORTED_FORMAT,
          `No handler available for media type: ${media.type}`,
          'critical'
        );
      }

      // Initialize handler if needed
      await handler.initialize(this.container);

      // Set up event listeners
      this.setupHandlerListeners(handler);

      // Load media
      await handler.load(media);

      // Try to restore previous playback state
      const savedState = await this.stateManager.loadState(media.id);
      if (savedState) {
        handler.seek(savedState.currentTime);
        handler.setVolume(savedState.volume);
        handler.setPlaybackRate(savedState.playbackRate);
      } else {
        handler.setVolume(this.state.volume);
        handler.setPlaybackRate(this.state.playbackRate);
      }

      // Update state
      this.currentMedia = media;
      this.currentHandler = handler;
      this.state.currentMedia = media;
      // Validate duration before using it
      this.state.duration = this.validateDuration(handler.getDuration() || 0);
      this.state.error = null;

      // Start auto-save
      this.stateManager.startAutoSave(
        () => this.createPlaybackState(),
        this.config.autoSaveInterval
      );

      this.uiController.setLoading(false);
    } catch (error) {
      const mediaError = error instanceof Error
        ? this.createError(MediaErrorCode.LOAD_FAILED, error.message, 'high')
        : this.createError(MediaErrorCode.UNKNOWN_ERROR, 'Failed to load media', 'high');
      
      this.handleError(mediaError);
      throw mediaError;
    }
  }

  async play(): Promise<void> {
    if (!this.currentHandler) {
      throw this.createError(
        MediaErrorCode.PLAYBACK_FAILED,
        'No media loaded',
        'medium'
      );
    }

    try {
      await this.currentHandler.play();
      this.state.isPlaying = true;
      this.uiController.showControls(true);
    } catch (error) {
      const mediaError = error instanceof Error
        ? this.createError(MediaErrorCode.PLAYBACK_FAILED, error.message, 'high')
        : this.createError(MediaErrorCode.UNKNOWN_ERROR, 'Playback failed', 'high');
      
      this.handleError(mediaError);
      throw mediaError;
    }
  }

  pause(): void {
    if (this.currentHandler) {
      this.currentHandler.pause();
      this.state.isPlaying = false;
      this.saveCurrentState();
    }
  }

  stop(): void {
    if (this.currentHandler) {
      this.currentHandler.stop();
      this.state.isPlaying = false;
      this.state.currentTime = 0;
      this.stateManager.stopAutoSave();
      this.saveCurrentState();
    }
  }

  seek(position: number): void {
    if (this.currentHandler) {
      this.currentHandler.seek(position);
      this.state.currentTime = position;
      this.saveCurrentState();
    }
  }

  setVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    
    if (this.currentHandler) {
      this.currentHandler.setVolume(clampedVolume);
    }
    
    this.state.volume = clampedVolume;
  }

  setPlaybackRate(rate: number): void {
    const clampedRate = Math.max(0.25, Math.min(2.0, rate));
    
    if (this.currentHandler) {
      this.currentHandler.setPlaybackRate(clampedRate);
    }
    
    this.state.playbackRate = clampedRate;
  }

  minimize(): void {
    if (!this.config.enableMiniPlayer) {
      return;
    }

    this.state.isMinimized = true;
    this.uiController.setMinimized(true);
  }

  maximize(): void {
    this.state.isMinimized = false;
    this.state.isPictureInPicture = false;
    this.uiController.setMinimized(false);
  }

  async togglePictureInPicture(): Promise<void> {
    if (!this.config.enablePictureInPicture) {
      return;
    }

    if (this.currentHandler instanceof VideoController) {
      try {
        if (this.state.isPictureInPicture) {
          await this.currentHandler.disablePictureInPicture();
          this.state.isPictureInPicture = false;
        } else {
          await this.currentHandler.enablePictureInPicture();
          this.state.isPictureInPicture = true;
        }
        
        await this.uiController.setPictureInPicture(this.state.isPictureInPicture);
      } catch (error) {
        console.warn('Picture-in-Picture toggle failed:', error);
      }
    }
  }

  close(): void {
    this.stop();
    this.stateManager.stopAutoSave();
    
    if (this.currentHandler) {
      this.currentHandler.cleanup();
      this.currentHandler = null;
    }

    this.currentMedia = null;
    this.state.currentMedia = null;
    this.uiController.hide();

    // Cleanup resources associated with current media
    this.resourceManager.cleanupResource('current-handler').catch(error => {
      console.error('Failed to cleanup current handler:', error);
    });
  }

  getState(): IMediaState {
    return { ...this.state };
  }

  /**
   * Clean up all resources
   */
  async cleanup(): Promise<void> {
    console.log('[MediaPlayerCore] Starting comprehensive cleanup');

    // Stop playback and clear current state
    this.close();

    // Cleanup UI controller
    this.uiController.cleanup();

    // Cleanup state manager
    await this.stateManager.close();
    
    // Cleanup all handlers
    const handlerArray = Array.from(this.handlers.values());
    for (const handler of handlerArray) {
      try {
        handler.cleanup();
      } catch (error) {
        console.error('Failed to cleanup handler:', error);
      }
    }
    
    this.handlers.clear();

    // Cleanup media element pool
    this.mediaPool.cleanup();

    // Cleanup all managed resources
    await this.resourceManager.cleanupAll();

    console.log('[MediaPlayerCore] Cleanup complete');
  }

  /**
   * Get resource statistics for monitoring
   */
  getResourceStats(): {
    resources: any;
    mediaPool: any;
    handlers: number;
  } {
    return {
      resources: this.resourceManager.getResourceStats(),
      mediaPool: this.mediaPool.getStats(),
      handlers: this.handlers.size
    };
  }

  private registerHandlers(): void {
    this.handlers.set('AUDIO', new AudioController());
    this.handlers.set('VIDEO', new VideoController());
    this.handlers.set('EBOOK', new EbookController());
  }

  private selectHandler(mediaType: string): IMediaHandler | null {
    const handler = this.handlers.get(mediaType);
    return handler && handler.canHandle(mediaType as any) ? handler : null;
  }

  private setupHandlerListeners(handler: IMediaHandler): void {
    handler.onTimeUpdate((time) => {
      this.state.currentTime = time;
      // Update duration on every timeupdate as fallback
      const currentDuration = handler.getDuration() || 0;
      // Validate duration before using it
      const validDuration = this.validateDuration(currentDuration);
      if (validDuration !== this.state.duration) {
        this.state.duration = validDuration;
      }
      this.uiController.updateProgress(time, this.state.duration);
    });

    // Register duration change callback if handler supports it
    if (handler.onDurationChange) {
      handler.onDurationChange((duration) => {
        // Validate duration before using it
        const validDuration = this.validateDuration(duration);
        this.state.duration = validDuration;
        this.uiController.updateProgress(this.state.currentTime, validDuration);
      });
    }

    handler.onEnded(() => {
      this.state.isPlaying = false;
      this.state.currentTime = this.state.duration; // Set to end
      this.saveCurrentState();
      // Could trigger next media in playlist here
    });

    handler.onError((error) => {
      this.handleError(error);
    });
  }

  private createPlaybackState(): PlaybackState {
    return {
      mediaId: this.currentMedia?.id ?? '',
      currentTime: this.state.currentTime,
      duration: this.state.duration,
      volume: this.state.volume,
      playbackRate: this.state.playbackRate,
      isPlaying: this.state.isPlaying,
      lastUpdated: new Date()
    };
  }

  private async saveCurrentState(): Promise<void> {
    if (this.currentMedia) {
      try {
        await this.stateManager.saveState(this.createPlaybackState());
      } catch (error) {
        console.error('Failed to save playback state:', error);
      }
    }
  }

  private handleError(error: MediaPlayerError): void {
    this.state.error = error;
    this.state.isPlaying = false;
    this.uiController.setError(error);
    this.uiController.setLoading(false);
    
    console.error('Media Player Error:', error);
  }

  private createError(
    code: MediaErrorCode,
    message: string,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): MediaPlayerError {
    return {
      code,
      message,
      severity,
      timestamp: new Date(),
      context: {
        currentMedia: this.currentMedia?.id,
        viewMode: this.uiController.getViewMode()
      }
    };
  }

  /**
   * Validate duration value to ensure it's a valid number
   * Returns 0 for invalid values (NaN, Infinity, negative)
   */
  private validateDuration(duration: number): number {
    // Check for invalid values
    if (!Number.isFinite(duration) || isNaN(duration) || duration < 0) {
      return 0;
    }
    return duration;
  }
}
