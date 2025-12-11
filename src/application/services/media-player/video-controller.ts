/**
 * Video Controller
 * Single Responsibility: Handle video-specific playback logic including Picture-in-Picture
 */

import { MediaItem } from '@/src/entities/models/media';
import {
  IMediaHandler,
  MediaPlayerError,
  MediaErrorCode
} from '@/src/entities/models/media-player';
import { EventListenerManager } from './resource-manager';

export class VideoController implements IMediaHandler {
  private videoElement: HTMLVideoElement | null = null;
  private container: HTMLElement | null = null;
  private timeUpdateCallback: ((time: number) => void) | null = null;
  private endedCallback: (() => void) | null = null;
  private errorCallback: ((error: MediaPlayerError) => void) | null = null;
  private durationChangeCallback: ((duration: number) => void) | null = null;
  private isInitialized = false;
  private pipSupported = false;
  private eventManager: EventListenerManager = new EventListenerManager();

  canHandle(mediaType: string): boolean {
    return mediaType === 'VIDEO';
  }

  async initialize(container: HTMLElement): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.container = container;
    this.cleanup();
    this.createVideoElement();
    this.checkPictureInPictureSupport();
    this.isInitialized = true;
  }

  async load(media: MediaItem): Promise<void> {
    if (!this.videoElement) {
      throw this.createError(
        MediaErrorCode.LOAD_FAILED,
        'Video element not initialized',
        'critical'
      );
    }

    try {
      this.stop();
      
      this.videoElement.src = media.url;
      this.videoElement.load();

      await new Promise<void>((resolve, reject) => {
        if (!this.videoElement) {
          reject(new Error('Video element lost during load'));
          return;
        }

        const onLoadedMetadata = () => {
          this.videoElement?.removeEventListener('loadedmetadata', onLoadedMetadata);
          this.videoElement?.removeEventListener('error', onError);
          resolve();
        };

        const onError = () => {
          this.videoElement?.removeEventListener('loadedmetadata', onLoadedMetadata);
          this.videoElement?.removeEventListener('error', onError);
          
          // Detect CORS errors
          const videoError = this.videoElement?.error;
          if (videoError) {
            const isCorsError = 
              videoError.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED ||
              videoError.code === MediaError.MEDIA_ERR_NETWORK;
            
            if (isCorsError) {
              reject(this.createCorsError('Failed to load video due to CORS restrictions'));
            } else {
              reject(this.createError(
                MediaErrorCode.LOAD_FAILED,
                `Failed to load video metadata: ${this.getMediaErrorMessage(videoError)}`,
                'high'
              ));
            }
          } else {
            reject(this.createError(
              MediaErrorCode.LOAD_FAILED,
              'Failed to load video metadata',
              'high'
            ));
          }
        };

        this.videoElement.addEventListener('loadedmetadata', onLoadedMetadata);
        this.videoElement.addEventListener('error', onError);
      });
    } catch (error) {
      let mediaError: MediaPlayerError;
      
      if (error && typeof error === 'object' && 'code' in error) {
        // Already a MediaPlayerError
        mediaError = error as MediaPlayerError;
      } else {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorString = errorMessage.toLowerCase();
        
        // Detect CORS errors from error message
        if (
          errorString.includes('cors') ||
          errorString.includes('cross-origin') ||
          errorString.includes('access-control-allow-origin') ||
          errorString.includes('blocked by cors')
        ) {
          mediaError = this.createCorsError(errorMessage);
        } else {
          mediaError = this.createError(MediaErrorCode.LOAD_FAILED, errorMessage, 'high');
        }
      }
      
      this.errorCallback?.(mediaError);
      throw mediaError;
    }
  }

  async play(): Promise<void> {
    if (!this.videoElement) {
      throw this.createError(
        MediaErrorCode.PLAYBACK_FAILED,
        'Video element not initialized',
        'critical'
      );
    }

    try {
      await this.videoElement.play();
    } catch (error) {
      const mediaError = error instanceof Error
        ? this.createError(MediaErrorCode.PLAYBACK_FAILED, error.message, 'high')
        : this.createError(MediaErrorCode.UNKNOWN_ERROR, 'Unknown playback error', 'high');
      
      this.errorCallback?.(mediaError);
      throw mediaError;
    }
  }

  pause(): void {
    if (this.videoElement) {
      this.videoElement.pause();
    }
  }

  stop(): void {
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.currentTime = 0;
    }
  }

  seek(position: number): void {
    if (this.videoElement) {
      this.videoElement.currentTime = position;
    }
  }

  setVolume(volume: number): void {
    if (this.videoElement) {
      this.videoElement.volume = Math.max(0, Math.min(1, volume));
    }
  }

  setPlaybackRate(rate: number): void {
    if (this.videoElement) {
      this.videoElement.playbackRate = Math.max(0.25, Math.min(2.0, rate));
    }
  }

  getCurrentTime(): number {
    return this.videoElement?.currentTime ?? 0;
  }

  getDuration(): number {
    return this.videoElement?.duration ?? 0;
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

  onDurationChange(callback: (duration: number) => void): void {
    this.durationChangeCallback = callback;
  }

  /**
   * Enable Picture-in-Picture mode for video
   */
  async enablePictureInPicture(): Promise<void> {
    if (!this.videoElement) {
      throw this.createError(
        MediaErrorCode.PLAYBACK_FAILED,
        'Video element not initialized',
        'medium'
      );
    }

    if (!this.pipSupported) {
      throw this.createError(
        MediaErrorCode.UNSUPPORTED_FORMAT,
        'Picture-in-Picture not supported',
        'low'
      );
    }

    try {
      if (document.pictureInPictureElement !== this.videoElement) {
        await this.videoElement.requestPictureInPicture();
      }
    } catch (error) {
      const mediaError = error instanceof Error
        ? this.createError(MediaErrorCode.PLAYBACK_FAILED, error.message, 'medium')
        : this.createError(MediaErrorCode.UNKNOWN_ERROR, 'PiP activation failed', 'medium');
      
      this.errorCallback?.(mediaError);
      throw mediaError;
    }
  }

  /**
   * Disable Picture-in-Picture mode
   */
  async disablePictureInPicture(): Promise<void> {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      }
    } catch (error) {
      // Silently fail as this is not critical
      console.warn('Failed to exit Picture-in-Picture:', error);
    }
  }

  /**
   * Check if currently in Picture-in-Picture mode
   */
  isPictureInPictureActive(): boolean {
    return document.pictureInPictureElement === this.videoElement;
  }

  cleanup(): void {
    // Exit PiP if active
    if (this.videoElement && this.isPictureInPictureActive()) {
      this.disablePictureInPicture().catch(() => {});
    }

    // Remove all tracked event listeners
    if (this.videoElement) {
      this.eventManager.removeAllListeners(this.videoElement);
    }

    // Cleanup event manager
    this.eventManager.cleanup();

    if (this.videoElement) {
      // Stop playback and clear source
      this.videoElement.pause();
      this.videoElement.src = '';
      
      // Remove srcObject if present (for MediaStream)
      if ('srcObject' in this.videoElement) {
        (this.videoElement as any).srcObject = null;
      }
      
      // Force garbage collection by loading empty data
      this.videoElement.load();
      
      // Remove from DOM
      if (this.videoElement.parentNode) {
        this.videoElement.parentNode.removeChild(this.videoElement);
      }
      
      this.videoElement = null;
    }

    // Clear all callbacks
    this.timeUpdateCallback = null;
    this.endedCallback = null;
    this.errorCallback = null;
    this.durationChangeCallback = null;
    this.isInitialized = false;
  }

  private createVideoElement(): void {
    this.cleanup();

    this.videoElement = document.createElement('video');
    this.videoElement.preload = 'metadata';
    this.videoElement.controls = false; // We'll provide custom controls
    this.videoElement.playsInline = true; // Important for mobile
    
    // Set up event listeners using event manager for proper cleanup
    const timeUpdateHandler = () => {
      if (this.videoElement && this.timeUpdateCallback) {
        this.timeUpdateCallback(this.videoElement.currentTime);
      }
    };

    const endedHandler = () => {
      this.endedCallback?.();
    };

    const errorHandler = () => {
      const error = this.createError(
        MediaErrorCode.PLAYBACK_FAILED,
        'Video playback error',
        'high'
      );
      this.errorCallback?.(error);
    };

    const pipEnterHandler = () => {
      console.log('Entered Picture-in-Picture mode');
    };

    const pipLeaveHandler = () => {
      console.log('Left Picture-in-Picture mode');
    };

    // Track event listeners for proper cleanup
    this.eventManager.addEventListener(this.videoElement, 'timeupdate', timeUpdateHandler);
    this.eventManager.addEventListener(this.videoElement, 'ended', endedHandler);
    this.eventManager.addEventListener(this.videoElement, 'error', errorHandler);
    this.eventManager.addEventListener(this.videoElement, 'enterpictureinpicture', pipEnterHandler);
    this.eventManager.addEventListener(this.videoElement, 'leavepictureinpicture', pipLeaveHandler);

    // Prevent memory leaks from media loading errors
    const loadErrorHandler = () => {
      console.warn('Video load error detected, cleaning up resources');
    };
    this.eventManager.addEventListener(this.videoElement, 'abort', loadErrorHandler);
    this.eventManager.addEventListener(this.videoElement, 'stalled', loadErrorHandler);

    // Duration change listeners
    const loadedMetadataHandler = () => {
      if (this.videoElement && this.durationChangeCallback) {
        const duration = this.videoElement.duration;
        if (isFinite(duration)) {
          this.durationChangeCallback(duration);
        }
      }
    };

    const durationChangeHandler = () => {
      if (this.videoElement && this.durationChangeCallback) {
        const duration = this.videoElement.duration;
        if (isFinite(duration)) {
          this.durationChangeCallback(duration);
        }
      }
    };

    this.eventManager.addEventListener(this.videoElement, 'loadedmetadata', loadedMetadataHandler);
    this.eventManager.addEventListener(this.videoElement, 'durationchange', durationChangeHandler);

    if (this.container) {
      this.container.appendChild(this.videoElement);
    }
  }

  private checkPictureInPictureSupport(): void {
    this.pipSupported = 'pictureInPictureEnabled' in document;
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
        controller: 'VideoController',
        pipSupported: this.pipSupported
      }
    };
  }

  private createCorsError(message: string): MediaPlayerError {
    return {
      code: MediaErrorCode.NETWORK_ERROR,
      message: 'Unable to load video due to CORS restrictions',
      severity: 'high',
      timestamp: new Date(),
      context: {
        controller: 'VideoController',
        errorType: 'CORS',
        originalMessage: message,
        suggestions: [
          'The video file may be hosted on a server that blocks cross-origin requests',
          'Verify that the server has proper CORS headers configured',
          'Check if the video URL is accessible and properly configured',
          'Try downloading the file for offline playback',
          'Contact your administrator to configure CORS headers'
        ]
      }
    };
  }

  private getMediaErrorMessage(error: MediaError): string {
    switch (error.code) {
      case MediaError.MEDIA_ERR_ABORTED:
        return 'Video loading was aborted';
      case MediaError.MEDIA_ERR_NETWORK:
        return 'Network error while loading video';
      case MediaError.MEDIA_ERR_DECODE:
        return 'Video decoding failed';
      case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
        return 'Video format not supported or source not accessible';
      default:
        return 'Unknown video error';
    }
  }
}
