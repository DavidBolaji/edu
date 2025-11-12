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

  // Initialize ebook controller
  useEffect(() => {
    const initializeController = async () => {
      if (!containerRef.current) return;

      try {
        setIsLoading(true);
        
        // Create controller if it doesn't exist
        if (!controllerRef.current) {
          controllerRef.current = new EbookController();
          
          // Set up event listeners
          if (onTimeUpdate) {
            controllerRef.current.onTimeUpdate(onTimeUpdate);
          }
          
          if (onEnded) {
            controllerRef.current.onEnded(onEnded);
          }
          
          if (onError) {
            controllerRef.current.onError(onError);
          }
          
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
        onError?.(error);
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
  }, [media, onTimeUpdate, onEnded, onError]);

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
        'relative w-full h-full flex flex-col',
        className
      )}
      data-testid="ebook-viewer"
    >
      {/* Ebook Content Container */}
      <div 
        ref={containerRef}
        className="flex-1 relative bg-white dark:bg-gray-900 overflow-hidden"
        data-ebook-container
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Loading ebook...</p>
            </div>
          </div>
        )}
      </div>

      {/* Ebook Controls */}
      <EbookControls
        currentPage={currentPage}
        totalPages={totalPages}
        onNextPage={handleNextPage}
        onPreviousPage={handlePreviousPage}
        onGoToPage={handleGoToPage}
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-auto min-w-[320px]"
      />
    </div>
  );
}
