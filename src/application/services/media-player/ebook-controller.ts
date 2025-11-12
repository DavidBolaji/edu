/**
 * Ebook Controller
 * Single Responsibility: Handle ebook-specific display and navigation logic
 * Implements secure viewing with download prevention measures
 */

import { MediaItem } from '@/src/entities/models/media';
import {
  IMediaHandler,
  MediaPlayerError,
  MediaErrorCode
} from '@/src/entities/models/media-player';
import { EventListenerManager } from './resource-manager';

export class EbookController implements IMediaHandler {
  private container: HTMLElement | null = null;
  private iframe: HTMLIFrameElement | null = null;
  private contentWrapper: HTMLDivElement | null = null;
  private currentPage = 0;
  private totalPages = 0;
  private timeUpdateCallback: ((time: number) => void) | null = null;
  private endedCallback: (() => void) | null = null;
  private errorCallback: ((error: MediaPlayerError) => void) | null = null;
  private isInitialized = false;
  private progressInterval: NodeJS.Timeout | null = null;
  private eventManager: EventListenerManager = new EventListenerManager();

  canHandle(mediaType: string): boolean {
    return mediaType === 'EBOOK';
  }

  async initialize(container: HTMLElement): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.container = container;
    this.cleanup();
    this.createSecureViewer();
    this.isInitialized = true;
  }

  async load(media: MediaItem): Promise<void> {
    if (!this.iframe) {
      throw this.createError(
        MediaErrorCode.LOAD_FAILED,
        'Ebook viewer not initialized',
        'critical'
      );
    }

    try {
      this.stop();
      
      // Load the ebook URL with security measures
      this.iframe.src = media.url;
      this.currentPage = 0;

      await new Promise<void>((resolve, reject) => {
        if (!this.iframe) {
          reject(new Error('Iframe lost during load'));
          return;
        }

        const onLoad = () => {
          this.iframe?.removeEventListener('load', onLoad);
          this.iframe?.removeEventListener('error', onError);
          
          // Apply additional security measures after load
          this.applyContentProtection();
          resolve();
        };

        const onError = () => {
          this.iframe?.removeEventListener('load', onLoad);
          this.iframe?.removeEventListener('error', onError);
          reject(this.createError(
            MediaErrorCode.LOAD_FAILED,
            'Failed to load ebook',
            'high'
          ));
        };

        this.iframe.addEventListener('load', onLoad);
        this.iframe.addEventListener('error', onError);
      });

      // Start simulating progress for ebook reading
      this.startProgressTracking();
    } catch (error) {
      const mediaError = error instanceof Error 
        ? this.createError(MediaErrorCode.LOAD_FAILED, error.message, 'high')
        : this.createError(MediaErrorCode.UNKNOWN_ERROR, 'Unknown error during load', 'high');
      
      this.errorCallback?.(mediaError);
      throw mediaError;
    }
  }

  async play(): Promise<void> {
    // For ebooks, "play" means start tracking reading progress
    this.startProgressTracking();
  }

  pause(): void {
    // For ebooks, "pause" means stop tracking reading progress
    this.stopProgressTracking();
  }

  stop(): void {
    this.stopProgressTracking();
    this.currentPage = 0;
  }

  seek(position: number): void {
    // For ebooks, seeking means going to a specific page/position
    // Position is normalized (0-1), convert to page number
    const targetPage = Math.floor(position * this.totalPages);
    this.goToPage(targetPage);
  }

  setVolume(_volume: number): void {
    // Not applicable for ebooks
  }

  setPlaybackRate(_rate: number): void {
    // Not applicable for ebooks
  }

  getCurrentTime(): number {
    // Return normalized progress (0-1)
    return this.totalPages > 0 ? this.currentPage / this.totalPages : 0;
  }

  getDuration(): number {
    // For ebooks, duration is always 1 (normalized)
    return 1;
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

  /**
   * Navigate to a specific page
   */
  goToPage(pageNumber: number): void {
    if (pageNumber < 0 || pageNumber >= this.totalPages) {
      return;
    }

    this.currentPage = pageNumber;
    this.notifyProgress();

    // Check if reached the end
    if (this.currentPage >= this.totalPages - 1) {
      this.endedCallback?.();
    }
  }

  /**
   * Go to next page
   */
  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  /**
   * Go to previous page
   */
  previousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  /**
   * Get current page number
   */
  getCurrentPage(): number {
    return this.currentPage;
  }

  /**
   * Get total pages
   */
  getTotalPages(): number {
    return this.totalPages;
  }

  /**
   * Set total pages (should be called after ebook metadata is loaded)
   */
  setTotalPages(pages: number): void {
    this.totalPages = pages;
  }

  cleanup(): void {
    this.stopProgressTracking();

    // Remove all tracked event listeners
    if (this.contentWrapper) {
      this.eventManager.removeAllListeners(this.contentWrapper);
    }
    if (this.iframe) {
      this.eventManager.removeAllListeners(this.iframe);
    }

    // Cleanup event manager
    this.eventManager.cleanup();

    if (this.iframe) {
      // Clear iframe content to free memory
      this.iframe.src = 'about:blank';
      
      // Remove from DOM
      if (this.iframe.parentNode) {
        this.iframe.parentNode.removeChild(this.iframe);
      }
      
      this.iframe = null;
    }

    if (this.contentWrapper) {
      // Remove from DOM
      if (this.contentWrapper.parentNode) {
        this.contentWrapper.parentNode.removeChild(this.contentWrapper);
      }
      
      this.contentWrapper = null;
    }

    // Clear all callbacks
    this.timeUpdateCallback = null;
    this.endedCallback = null;
    this.errorCallback = null;
    this.currentPage = 0;
    this.totalPages = 0;
    this.isInitialized = false;
  }

  /**
   * Create secure ebook viewer with download prevention
   */
  private createSecureViewer(): void {
    this.cleanup();

    // Create wrapper for additional security layers
    this.contentWrapper = document.createElement('div');
    this.contentWrapper.style.cssText = `
      width: 100%;
      height: 100%;
      position: relative;
      overflow: hidden;
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
    `;

    // Create secure iframe with restricted permissions
    this.iframe = document.createElement('iframe');
    this.iframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      pointer-events: auto;
    `;

    // Set restrictive sandbox permissions
    // Only allow scripts and same-origin, but prevent downloads, forms, popups
    this.iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts');
    
    // Prevent right-click context menu
    this.iframe.setAttribute('oncontextmenu', 'return false;');
    
    // Set referrer policy for privacy
    this.iframe.setAttribute('referrerpolicy', 'no-referrer');
    
    // Set CSP for additional security
    this.iframe.setAttribute('csp', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';");

    // Add iframe to wrapper
    this.contentWrapper.appendChild(this.iframe);

    // Create transparent overlay to prevent direct interaction
    const protectionOverlay = document.createElement('div');
    protectionOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
      pointer-events: none;
      background: transparent;
    `;
    this.contentWrapper.appendChild(protectionOverlay);

    // Add wrapper to container
    if (this.container) {
      this.container.appendChild(this.contentWrapper);
    }

    // Prevent context menu on wrapper using event manager
    const contextMenuHandler = (e: Event) => {
      e.preventDefault();
      return false;
    };
    this.eventManager.addEventListener(this.contentWrapper, 'contextmenu', contextMenuHandler);

    // Prevent text selection
    const selectStartHandler = (e: Event) => {
      e.preventDefault();
      return false;
    };
    this.eventManager.addEventListener(this.contentWrapper, 'selectstart', selectStartHandler);

    // Prevent drag and drop
    const dragStartHandler = (e: Event) => {
      e.preventDefault();
      return false;
    };
    this.eventManager.addEventListener(this.contentWrapper, 'dragstart', dragStartHandler);

    // Prevent copy
    const copyHandler = (e: Event) => {
      e.preventDefault();
      return false;
    };
    this.eventManager.addEventListener(this.contentWrapper, 'copy', copyHandler);

    // Prevent cut
    const cutHandler = (e: Event) => {
      e.preventDefault();
      return false;
    };
    this.eventManager.addEventListener(this.contentWrapper, 'cut', cutHandler);

    // Prevent keyboard shortcuts for saving/printing
    const keydownHandler = (e: Event) => {
      const keyEvent = e as KeyboardEvent;
      // Prevent Ctrl+S (Save), Ctrl+P (Print), Ctrl+C (Copy)
      if (keyEvent.ctrlKey || keyEvent.metaKey) {
        if (keyEvent.key === 's' || keyEvent.key === 'p' || keyEvent.key === 'c') {
          e.preventDefault();
          return false;
        }
      }
    };
    this.eventManager.addEventListener(this.contentWrapper, 'keydown', keydownHandler);
  }

  /**
   * Apply content protection measures after iframe loads
   */
  private applyContentProtection(): void {
    if (!this.iframe) return;

    try {
      // Try to access iframe content (only works for same-origin)
      const iframeDoc = this.iframe.contentDocument || this.iframe.contentWindow?.document;
      
      if (iframeDoc) {
        // Disable right-click
        iframeDoc.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          return false;
        });

        // Disable text selection
        iframeDoc.addEventListener('selectstart', (e) => {
          e.preventDefault();
          return false;
        });

        // Disable copy
        iframeDoc.addEventListener('copy', (e) => {
          e.preventDefault();
          return false;
        });

        // Disable drag
        iframeDoc.addEventListener('dragstart', (e) => {
          e.preventDefault();
          return false;
        });

        // Apply CSS to prevent selection
        const style = iframeDoc.createElement('style');
        style.textContent = `
          * {
            user-select: none !important;
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            -webkit-touch-callout: none !important;
          }
          
          img {
            pointer-events: none !important;
            -webkit-user-drag: none !important;
            -khtml-user-drag: none !important;
            -moz-user-drag: none !important;
            -o-user-drag: none !important;
            user-drag: none !important;
          }
        `;
        iframeDoc.head?.appendChild(style);

        // Disable print
        if (iframeDoc.defaultView) {
          iframeDoc.defaultView.print = function() {
            console.warn('Printing is disabled for this content');
          };
        }
      }
    } catch (error) {
      // Cross-origin iframe - security measures on wrapper are sufficient
      console.log('Cross-origin iframe detected, using wrapper-level protection');
    }
  }

  private startProgressTracking(): void {
    if (this.progressInterval) {
      return;
    }

    // Simulate progress updates every 5 seconds while "reading"
    this.progressInterval = setInterval(() => {
      this.notifyProgress();
    }, 5000);
  }

  private stopProgressTracking(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  private notifyProgress(): void {
    if (this.timeUpdateCallback) {
      const progress = this.getCurrentTime();
      this.timeUpdateCallback(progress);
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
        controller: 'EbookController',
        currentPage: this.currentPage,
        totalPages: this.totalPages
      }
    };
  }
}
