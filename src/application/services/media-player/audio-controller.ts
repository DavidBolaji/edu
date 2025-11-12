/**
 * Audio Controller
 * Single Responsibility: Handle audio-specific playback logic
 * Prevents duplicate audio streams and echoing issues
 */

import { MediaItem } from '@/src/entities/models/media';
import {
  IMediaHandler,
  MediaPlayerError,
  MediaErrorCode
} from '@/src/entities/models/media-player';
import { EventListenerManager } from './resource-manager';

export class AudioController implements IMediaHandler {
  private audioElement: HTMLAudioElement | null = null;
  private container: HTMLElement | null = null;
  private timeUpdateCallback: ((time: number) => void) | null = null;
  private endedCallback: (() => void) | null = null;
  private errorCallback: ((error: MediaPlayerError) => void) | null = null;
  private isInitialized = false;
  private eventManager: EventListenerManager = new EventListenerManager();

  canHandle(mediaType: string): boolean {
    return mediaType === 'AUDIO';
  }

  async initialize(container: HTMLElement): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.container = container;
    this.cleanup(); // Ensure no duplicate audio elements
    this.createAudioElement();
    this.isInitialized = true;
  }

  async load(media: MediaItem): Promise<void> {
    if (!this.audioElement) {
      throw this.createError(
        MediaErrorCode.LOAD_FAILED,
        'Audio element not initialized',
        'critical'
      );
    }

    try {
      // Prevent duplicate streams by stopping current playback
      this.stop();
      
      this.audioElement.src = media.url;
      this.audioElement.load();

      // Wait for metadata to be loaded
      await new Promise<void>((resolve, reject) => {
        if (!this.audioElement) {
          reject(new Error('Audio element lost during load'));
          return;
        }

        const onLoadedMetadata = () => {
          this.audioElement?.removeEventListener('loadedmetadata', onLoadedMetadata);
          this.audioElement?.removeEventListener('error', onError);
          resolve();
        };

        const onError = () => {
          this.audioElement?.removeEventListener('loadedmetadata', onLoadedMetadata);
          this.audioElement?.removeEventListener('error', onError);
          reject(this.createError(
            MediaErrorCode.LOAD_FAILED,
            'Failed to load audio metadata',
            'high'
          ));
        };

        this.audioElement.addEventListener('loadedmetadata', onLoadedMetadata);
        this.audioElement.addEventListener('error', onError);
      });
    } catch (error) {
      const mediaError = error instanceof Error 
        ? this.createError(MediaErrorCode.LOAD_FAILED, error.message, 'high')
        : this.createError(MediaErrorCode.UNKNOWN_ERROR, 'Unknown error during load', 'high');
      
      this.errorCallback?.(mediaError);
      throw mediaError;
    }
  }

  async play(): Promise<void> {
    if (!this.audioElement) {
      throw this.createError(
        MediaErrorCode.PLAYBACK_FAILED,
        'Audio element not initialized',
        'critical'
      );
    }

    try {
      await this.audioElement.play();
    } catch (error) {
      const mediaError = error instanceof Error
        ? this.createError(MediaErrorCode.PLAYBACK_FAILED, error.message, 'high')
        : this.createError(MediaErrorCode.UNKNOWN_ERROR, 'Unknown playback error', 'high');
      
      this.errorCallback?.(mediaError);
      throw mediaError;
    }
  }

  pause(): void {
    if (this.audioElement) {
      this.audioElement.pause();
    }
  }

  stop(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
  }

  seek(position: number): void {
    if (this.audioElement) {
      this.audioElement.currentTime = position;
    }
  }

  setVolume(volume: number): void {
    if (this.audioElement) {
      // Clamp volume between 0 and 1
      this.audioElement.volume = Math.max(0, Math.min(1, volume));
    }
  }

  setPlaybackRate(rate: number): void {
    if (this.audioElement) {
      // Clamp playback rate between 0.25 and 2.0
      this.audioElement.playbackRate = Math.max(0.25, Math.min(2.0, rate));
    }
  }

  getCurrentTime(): number {
    return this.audioElement?.currentTime ?? 0;
  }

  getDuration(): number {
    return this.audioElement?.duration ?? 0;
  }

  onTimeUpdate(callback: (time: number) => void): void {
    this.timeUpdateCallback = callback;
  }

  onEnded(callback: () => void): void {
    this.endedCallback = callback;
  }

  onError(callback: (error: MediaPlayerError) => void): void {
    this.errorCallback = callback;
  }

  cleanup(): void {
    // Remove all tracked event listeners
    if (this.audioElement) {
      this.eventManager.removeAllListeners(this.audioElement);
    }

    // Cleanup event manager
    this.eventManager.cleanup();

    if (this.audioElement) {
      // Stop playback and clear source
      this.audioElement.pause();
      this.audioElement.src = '';
      
      // Remove srcObject if present (for MediaStream)
      if ('srcObject' in this.audioElement) {
        (this.audioElement as any).srcObject = null;
      }
      
      // Force garbage collection by loading empty data
      this.audioElement.load();
      
      // Remove from DOM
      if (this.audioElement.parentNode) {
        this.audioElement.parentNode.removeChild(this.audioElement);
      }
      
      this.audioElement = null;
    }

    // Clear all callbacks
    this.timeUpdateCallback = null;
    this.endedCallback = null;
    this.errorCallback = null;
    this.isInitialized = false;
  }

  private createAudioElement(): void {
    // Ensure only one audio element exists to prevent echoing
    this.cleanup();

    this.audioElement = document.createElement('audio');
    this.audioElement.preload = 'metadata';
    
    // Set up event listeners using event manager for proper cleanup
    const timeUpdateHandler = () => {
      if (this.audioElement && this.timeUpdateCallback) {
        this.timeUpdateCallback(this.audioElement.currentTime);
      }
    };

    const endedHandler = () => {
      this.endedCallback?.();
    };

    const errorHandler = () => {
      const error = this.createError(
        MediaErrorCode.PLAYBACK_FAILED,
        'Audio playback error',
        'high'
      );
      this.errorCallback?.(error);
    };

    // Track event listeners for proper cleanup
    this.eventManager.addEventListener(this.audioElement, 'timeupdate', timeUpdateHandler);
    this.eventManager.addEventListener(this.audioElement, 'ended', endedHandler);
    this.eventManager.addEventListener(this.audioElement, 'error', errorHandler);

    // Prevent memory leaks from media loading errors
    const loadErrorHandler = () => {
      console.warn('Audio load error detected, cleaning up resources');
    };
    this.eventManager.addEventListener(this.audioElement, 'abort', loadErrorHandler);
    this.eventManager.addEventListener(this.audioElement, 'stalled', loadErrorHandler);

    // Append to container if available
    if (this.container) {
      this.container.appendChild(this.audioElement);
    }
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
        controller: 'AudioController'
      }
    };
  }
}
