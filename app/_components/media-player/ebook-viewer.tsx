'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/app/_lib/utils';
import { EbookControls } from './ebook-controls';
import { EbookController } from '@/src/application/services/media-player/ebook-controller';
import { MediaItem } from '@/src/entities/models/media';

interface EbookViewerProps {
  media: MediaItem;
  onTimeUpdate?: (time: number) => void;
  onEnded?: () => void;
  onError?: (error: any) => void;
  className?: string;
}

export function EbookViewer({
  media,
  onTimeUpdate,
  onEnded,
  onError,
  className
}: EbookViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<EbookController | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(100); // Default, will be updated
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{
    message: string;
    suggestions: string[];
  } | null>(null);
  
  // Use refs for callbacks to avoid re-initializing on callback changes
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const onEndedRef = useRef(onEnded);
  const onErrorRef = useRef(onError);
  
  // Keep refs updated
  useEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate;
    onEndedRef.current = onEnded;
    onErrorRef.current = onError;
  }, [onTimeUpdate, onEnded, onError]);

  // Initialize ebook controller
  useEffect(() => {
    const initializeController = async () => {
      if (!containerRef.current) return;

      try {
        setIsLoading(true);
        setError(null);
        
        // Create controller if it doesn't exist
        if (!controllerRef.current) {
          controllerRef.current = new EbookController();
          
          // Set up event listeners using refs
          controllerRef.current.onTimeUpdate((time) => {
            onTimeUpdateRef.current?.(time);
          });
          
          controllerRef.current.onEnded(() => {
            onEndedRef.current?.();
          });
          
          // Enhanced error handler with CORS detection
          controllerRef.current.onError((err) => {
            const errorMessage = err?.message || String(err);
            const errorString = errorMessage.toLowerCase();
            
            // Detect offline viewing errors
            if (errorString.includes('internet connection required')) {
              setError({
                message: err?.message || 'Internet connection required to view this ebook',
                suggestions: [
                  'Please connect to the internet to view this ebook',
                  'This ebook format cannot be viewed offline in your browser',
                  'The ebook will be loaded using Google Docs Viewer when online',
                  'Check your internet connection and try again'
                ]
              });
            }
            // Detect unsupported format errors
            else if (errorString.includes('format is not supported')) {
              setError({
                message: err?.message || 'Unsupported file format for offline viewing',
                suggestions: [
                  'Only PDF files can be viewed offline in the browser',
                  'Clear this file from cache to view it online instead',
                  'Use the "Clear from Cache" option in the library',
                  'Consider converting the file to PDF format for offline compatibility'
                ]
              });
            }
            // Detect CORS errors
            else if (
              errorString.includes('cors') ||
              errorString.includes('blocked') ||
              errorString.includes('cross-origin') ||
              errorString.includes('access-control-allow-origin')
            ) {
              setError({
                message: 'Unable to load ebook content due to security restrictions (CORS)',
                suggestions: [
                  'The file may be hosted on a server that blocks cross-origin requests',
                  'Try downloading the file for offline viewing',
                  'Contact your administrator to configure CORS headers',
                  'Ensure the file URL is accessible and properly configured'
                ]
              });
            }
            // Detect CSP errors
            else if (
              errorString.includes('content security policy') ||
              errorString.includes('csp') ||
              errorString.includes('refused to load')
            ) {
              setError({
                message: 'Content blocked by security policy',
                suggestions: [
                  'The content is blocked by Content Security Policy settings',
                  'Contact your administrator to update security policies',
                  'Try using a different file format',
                  'Download the file for offline viewing'
                ]
              });
            }
            // Generic errors
            else {
              setError({
                message: `Failed to load ebook: ${errorMessage}`,
                suggestions: [
                  'Check if the file URL is accessible',
                  'Verify the file format is supported (PDF, DOCX)',
                  'Try refreshing the page',
                  'Contact support if the issue persists'
                ]
              });
            }
            
            onErrorRef.current?.(err);
          });
          
          // Initialize with container
          await controllerRef.current.initialize(containerRef.current);
        }
        
        // Load the media
        await controllerRef.current.load(media);
        
        // Start "playing" (tracking progress)
        await controllerRef.current.play();
        
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize ebook viewer:', error);
        setIsLoading(false);
        
        // Handle initialization errors
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorString = errorMessage.toLowerCase();
        
        if (errorString.includes('internet connection required')) {
          setError({
            message: errorMessage,
            suggestions: [
              'Please connect to the internet to view this ebook',
              'This ebook format cannot be viewed offline in your browser',
              'The ebook will be loaded using Google Docs Viewer when online',
              'Check your internet connection and try again'
            ]
          });
        } else if (errorString.includes('format is not supported')) {
          setError({
            message: errorMessage,
            suggestions: [
              'Only PDF files can be viewed offline in the browser',
              'Clear this file from cache to view it online instead',
              'Use the "Clear from Cache" option in the library',
              'Consider converting the file to PDF format for offline compatibility'
            ]
          });
        } else if (
          errorString.includes('cors') ||
          errorString.includes('blocked') ||
          errorString.includes('cross-origin')
        ) {
          setError({
            message: 'Unable to load ebook content due to security restrictions (CORS)',
            suggestions: [
              'The file may be hosted on a server that blocks cross-origin requests',
              'Try downloading the file for offline viewing',
              'Contact your administrator to configure CORS headers'
            ]
          });
        } else {
          setError({
            message: `Failed to load ebook: ${errorMessage}`,
            suggestions: [
              'Check if the file URL is accessible',
              'Verify the file format is supported',
              'Try refreshing the page'
            ]
          });
        }
        
        onErrorRef.current?.(error);
      }
    };

    initializeController();

    // Cleanup on unmount
    return () => {
      if (controllerRef.current) {
        controllerRef.current.cleanup();
        controllerRef.current = null;
      }
    };
  }, [media.id]); // Only re-run when media ID changes, not on every callback change

  // Update current page from controller
  useEffect(() => {
    if (!controllerRef.current) return;

    const interval = setInterval(() => {
      if (controllerRef.current) {
        setCurrentPage(controllerRef.current.getCurrentPage());
        setTotalPages(controllerRef.current.getTotalPages());
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const handleNextPage = () => {
    if (controllerRef.current) {
      controllerRef.current.nextPage();
      setCurrentPage(controllerRef.current.getCurrentPage());
    }
  };

  const handlePreviousPage = () => {
    if (controllerRef.current) {
      controllerRef.current.previousPage();
      setCurrentPage(controllerRef.current.getCurrentPage());
    }
  };

  const handleGoToPage = (page: number) => {
    if (controllerRef.current) {
      controllerRef.current.goToPage(page);
      setCurrentPage(controllerRef.current.getCurrentPage());
    }
  };

  return (
    <div 
      className={cn(
        'relative w-full h-full',
        className
      )}
      data-testid="ebook-viewer"
    >
      {/* Ebook Content Container */}
      <div 
        ref={containerRef}
        className="w-full h-full relative bg-white dark:bg-gray-900 overflow-hidden"
        data-ebook-container
      >
        {isLoading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Loading ebook...</p>
            </div>
          </div>
        )}
        
        {/* Error Display */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-900 p-8">
            <div className="max-w-md text-center space-y-4">
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {error.message}
              </h3>
              <div className="text-left bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Troubleshooting suggestions:
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                  {error.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ebook Controls - Only show when no error */}
      {/* {!error && (
        <EbookControls
          currentPage={currentPage}
          totalPages={totalPages}
          onNextPage={handleNextPage}
          onPreviousPage={handlePreviousPage}
          onGoToPage={handleGoToPage}
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-auto min-w-[320px] z-40"
        />
      )} */}
    </div>
  );
}
