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
      
      // Check if this is a blob URL (offline media from library)
      const isBlobUrl = media.url.startsWith('blob:');
      
      if (isBlobUrl) {
        // For blob URLs, remove sandbox entirely as they're local and safe
        // Chrome blocks blob URLs in sandboxed iframes
        if (this.iframe) {
          this.iframe.removeAttribute('sandbox');
        }
        // Try to render blob URL directly first
        await this.loadWithFallback(media);
      } else {
        // For Google Docs Viewer, use restrictive sandbox for security
        if (this.iframe) {
          this.iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox');
        }
        // Use Google Docs Viewer as a proxy to bypass CORS/CSP issues
        // This works for PDF, DOCX, PPTX, and other document formats
        const viewerUrl = this.formatGoogleDocsViewerURL(media.url);
        this.iframe.src = viewerUrl;
      }
      
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

        const onError = (event: Event) => {
          this.iframe?.removeEventListener('load', onLoad);
          this.iframe?.removeEventListener('error', onError);
          
          // Try to detect the type of error
          const errorEvent = event as ErrorEvent;
          const errorMessage = errorEvent.message || 'Failed to load ebook';
          const errorString = errorMessage.toLowerCase();
          
          // Check if this was a blob URL that failed
          if (isBlobUrl) {
            reject(this.createError(
              MediaErrorCode.LOAD_FAILED,
              'Failed to load offline ebook. The cached file may be corrupted or in an unsupported format.',
              'high'
            ));
          }
          // Detect CSP errors
          else if (
            errorString.includes('content security policy') ||
            errorString.includes('csp') ||
            errorString.includes('refused to load') ||
            errorString.includes('blocked by csp')
          ) {
            reject(this.createCspError(errorMessage));
          }
          // Detect CORS errors
          else if (
            errorString.includes('cors') ||
            errorString.includes('cross-origin') ||
            errorString.includes('access-control-allow-origin') ||
            errorString.includes('blocked')
          ) {
            reject(this.createCorsError(errorMessage));
          }
          // Generic error
          else {
            reject(this.createError(
              MediaErrorCode.LOAD_FAILED,
              'Failed to load ebook',
              'high'
            ));
          }
        };

        this.iframe.addEventListener('load', onLoad);
        this.iframe.addEventListener('error', onError);
        
        // Also listen for CSP violations on the window
        const cspViolationHandler = (event: SecurityPolicyViolationEvent) => {
          console.error('CSP Violation detected:', event);
          this.iframe?.removeEventListener('load', onLoad);
          this.iframe?.removeEventListener('error', onError);
          window.removeEventListener('securitypolicyviolation', cspViolationHandler);
          
          reject(this.createCspError(
            `Content Security Policy violation: ${event.violatedDirective} - ${event.blockedURI}`
          ));
        };
        
        window.addEventListener('securitypolicyviolation', cspViolationHandler);
        
        // Cleanup CSP listener after a timeout
        setTimeout(() => {
          window.removeEventListener('securitypolicyviolation', cspViolationHandler);
        }, 5000);
      });

      // Start simulating progress for ebook reading
      this.startProgressTracking();
    } catch (error) {
      let mediaError: MediaPlayerError;
      
      if (error && typeof error === 'object' && 'code' in error) {
        // Already a MediaPlayerError
        mediaError = error as MediaPlayerError;
      } else {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorString = errorMessage.toLowerCase();
        
        // Detect CSP errors from error message
        if (
          errorString.includes('content security policy') ||
          errorString.includes('csp') ||
          errorString.includes('refused to load')
        ) {
          mediaError = this.createCspError(errorMessage);
        }
        // Detect CORS errors from error message
        else if (
          errorString.includes('cors') ||
          errorString.includes('cross-origin') ||
          errorString.includes('access-control-allow-origin') ||
          errorString.includes('blocked')
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
      display: block;
      z-index: 1;
    `;

    // Initially set minimal sandbox permissions
    // We'll update these based on the content type being loaded
    this.iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts');
    
    // Prevent right-click context menu
    this.iframe.setAttribute('oncontextmenu', 'return false;');
    
    // Set referrer policy for privacy
    this.iframe.setAttribute('referrerpolicy', 'no-referrer');

    // Add iframe to wrapper
    this.contentWrapper.appendChild(this.iframe);

    // Create blocking overlay specifically for the Google Drive link area
    // Google Docs Viewer shows "Open with Google Docs" link at top-right
    const googleLinkBlocker = document.createElement('div');
    googleLinkBlocker.style.cssText = `
      position: absolute;
      top: 0;
      right: 0;
      width: 200px;
      height: 60px;
      z-index: 20;
      pointer-events: auto;
      background: transparent;
      cursor: default;
    `;
    googleLinkBlocker.title = 'Document viewer';
    this.contentWrapper.appendChild(googleLinkBlocker);

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

  /**
   * Load blob URL with intelligent fallback system
   */
  private async loadWithFallback(media: MediaItem): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.iframe) {
        reject(new Error('Iframe not available'));
        return;
      }

      let fallbackAttempted = false;

      const onLoad = () => {
        this.iframe?.removeEventListener('load', onLoad);
        this.iframe?.removeEventListener('error', onError);
        resolve();
      };

      const onError = async () => {
        this.iframe?.removeEventListener('load', onLoad);
        this.iframe?.removeEventListener('error', onError);

        // If blob URL failed and we haven't tried fallback yet
        if (!fallbackAttempted) {
          fallbackAttempted = true;

          // Check if we have internet connection
          const isOnline = await this.checkInternetConnection();
          
          if (isOnline) {
            // Try to get original URL from metadata and use Google Docs Viewer
            const originalUrl = await this.getOriginalUrlFromCache(media.url);
            
            if (originalUrl) {
              console.log('Blob URL failed, falling back to Google Docs Viewer with original URL');
              
              // Set up new listeners for fallback attempt
              const fallbackOnLoad = () => {
                this.iframe?.removeEventListener('load', fallbackOnLoad);
                this.iframe?.removeEventListener('error', fallbackOnError);
                resolve();
              };

              const fallbackOnError = () => {
                this.iframe?.removeEventListener('load', fallbackOnLoad);
                this.iframe?.removeEventListener('error', fallbackOnError);
                reject(this.createError(
                  MediaErrorCode.LOAD_FAILED,
                  'Failed to load ebook both from cache and online',
                  'high'
                ));
              };

              if (this.iframe) {
                // Switch to sandboxed mode for Google Docs Viewer
                this.iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox');
                
                this.iframe.addEventListener('load', fallbackOnLoad);
                this.iframe.addEventListener('error', fallbackOnError);

                // Load with Google Docs Viewer
                const viewerUrl = this.formatGoogleDocsViewerURL(originalUrl);
                this.iframe.src = viewerUrl;
              } else {
                reject(new Error('Iframe lost during fallback'));
              }
              return;
            }
          }

          // No internet or no original URL - show offline message
          reject(this.createOfflineError(media.name));
        } else {
          // Fallback also failed
          reject(this.createError(
            MediaErrorCode.LOAD_FAILED,
            'Failed to load ebook from both cache and online source',
            'high'
          ));
        }
      };

      this.iframe.addEventListener('load', onLoad);
      this.iframe.addEventListener('error', onError);

      // Try loading blob URL first
      this.iframe.src = media.url;
    });
  }

  /**
   * Check if internet connection is available
   */
  private async checkInternetConnection(): Promise<boolean> {
    try {
      // Try to fetch a small resource to check connectivity
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      });
      return true;
    } catch {
      return navigator.onLine; // Fallback to navigator.onLine
    }
  }

  /**
   * Get original URL from IndexedDB cache metadata
   */
  private async getOriginalUrlFromCache(blobUrl: string): Promise<string | null> {
    try {
      // Open IndexedDB to get metadata
      const dbRequest = indexedDB.open('media-db', 1);
      
      return new Promise((resolve) => {
        dbRequest.onsuccess = () => {
          const db = dbRequest.result;
          const tx = db.transaction('mediaMetadata', 'readonly');
          const store = tx.objectStore('mediaMetadata');
          const getAllRequest = store.getAll();
          
          getAllRequest.onsuccess = () => {
            const allMetadata = getAllRequest.result;
            
            // Look for metadata with originalUrl field
            for (const metadata of allMetadata) {
              if (metadata.originalUrl && !metadata.originalUrl.startsWith('blob:')) {
                resolve(metadata.originalUrl);
                return;
              }
              // Fallback: look for any non-blob URL
              if (metadata.url && !metadata.url.startsWith('blob:')) {
                resolve(metadata.url);
                return;
              }
            }
            resolve(null);
          };
          
          getAllRequest.onerror = () => resolve(null);
        };
        
        dbRequest.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  /**
   * Format URL for Google Docs Viewer
   * This bypasses CORS/CSP issues by using Google as a proxy
   */
  private formatGoogleDocsViewerURL(fileURL: string): string {
    const baseURL = 'https://docs.google.com/gview';
    const params = {
      embedded: 'true',
      url: fileURL,
    };

    const formattedURL = Object.keys(params)
      .map((key) => {
        return (
          encodeURIComponent(key) +
          '=' +
          encodeURIComponent((params as any)[key as any])
        );
      })
      .join('&');

    return `${baseURL}?${formattedURL}`;
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

  private createCorsError(message: string): MediaPlayerError {
    return {
      code: MediaErrorCode.NETWORK_ERROR,
      message: 'Unable to load ebook even with Google Docs Viewer proxy',
      severity: 'high',
      timestamp: new Date(),
      context: {
        controller: 'EbookController',
        errorType: 'CORS',
        originalMessage: message,
        currentPage: this.currentPage,
        totalPages: this.totalPages,
        suggestions: [
          'The ebook URL may not be publicly accessible',
          'Verify that the file URL is correct and accessible from the internet',
          'Google Docs Viewer requires publicly accessible URLs',
          'Try downloading the file for offline viewing',
          'Ensure the file is hosted on a public server (not localhost or private network)'
        ]
      }
    };
  }

  private createCspError(message: string): MediaPlayerError {
    return {
      code: MediaErrorCode.PERMISSION_DENIED,
      message: 'Content blocked by security policy',
      severity: 'high',
      timestamp: new Date(),
      context: {
        controller: 'EbookController',
        errorType: 'CSP',
        originalMessage: message,
        currentPage: this.currentPage,
        totalPages: this.totalPages,
        suggestions: [
          'The content is blocked by Content Security Policy settings',
          'Google Docs Viewer is being used but may be blocked by your CSP',
          'Contact your administrator to allow docs.google.com in frame-src',
          'Try using a different file format (PDF instead of DOCX, or vice versa)',
          'Download the file for offline viewing as an alternative'
        ]
      }
    };
  }

  private createUnsupportedFormatError(format: string, fileName: string): MediaPlayerError {
    const formatUpper = format.toUpperCase();
    return {
      code: MediaErrorCode.UNSUPPORTED_FORMAT,
      message: `${formatUpper} format is not supported for offline viewing`,
      severity: 'medium',
      timestamp: new Date(),
      context: {
        controller: 'EbookController',
        errorType: 'UNSUPPORTED_FORMAT',
        format: formatUpper,
        fileName,
        currentPage: this.currentPage,
        totalPages: this.totalPages,
        suggestions: [
          `${formatUpper} files cannot be displayed directly in the browser when cached offline`,
          'Only PDF files are supported for offline ebook viewing',
          'You can still access this file by clearing it from cache and viewing it online',
          'Consider converting the file to PDF format for better offline compatibility',
          'Use the "Clear from Cache" option and view the file online instead'
        ]
      }
    };
  }

  private createOfflineError(fileName: string): MediaPlayerError {
    return {
      code: MediaErrorCode.NETWORK_ERROR,
      message: 'Cannot view ebook offline - Internet connection required',
      severity: 'medium',
      timestamp: new Date(),
      context: {
        controller: 'EbookController',
        errorType: 'OFFLINE_VIEWING_FAILED',
        fileName,
        currentPage: this.currentPage,
        totalPages: this.totalPages,
        suggestions: [
          'This ebook format cannot be viewed offline in your browser',
          'Please connect to the internet to view this ebook',
          'The ebook will be loaded using Google Docs Viewer when online',
          'Consider downloading PDF versions for better offline compatibility',
          'Check your internet connection and try again'
        ]
      }
    };
  }
}
