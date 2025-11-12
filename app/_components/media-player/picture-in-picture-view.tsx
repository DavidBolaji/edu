'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/app/_lib/utils';
import { Button } from '@/app/_components/ui/button';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  X,
  Move
} from 'lucide-react';
import { IMediaState } from '@/src/entities/models/media-player';
import { MediaType } from '@/src/entities/models/media';

interface PictureInPictureViewProps {
  state: IMediaState;
  onPlay: () => void;
  onPause: () => void;
  onVolumeToggle: () => void;
  onMaximize: () => void;
  onClose: () => void;
  className?: string;
}

export function PictureInPictureView({
  state,
  onPlay,
  onPause,
  onVolumeToggle,
  onMaximize,
  onClose,
  className
}: PictureInPictureViewProps) {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // Handle dragging functionality
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Keep within viewport bounds
      const maxX = window.innerWidth - 320; // Player width
      const maxY = window.innerHeight - 180; // Player height
      
      setPosition({
        x: Math.max(0, Math.min(maxX, newX)),
        y: Math.max(0, Math.min(maxY, newY))
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Auto-hide controls
  useEffect(() => {
    const resetTimeout = () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      setShowControls(true);
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2000);
    };

    const handleMouseEnter = () => resetTimeout();
    const handleMouseLeave = () => setShowControls(false);

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mouseenter', handleMouseEnter);
      container.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (container) {
        container.removeEventListener('mouseenter', handleMouseEnter);
        container.removeEventListener('mouseleave', handleMouseLeave);
      }
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).dataset.draggable) {
      setIsDragging(true);
      const rect = containerRef.current!.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  // Only show for video content
  if (!state.currentMedia || state.currentMedia.type !== MediaType.VIDEO) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'fixed bg-black rounded-lg overflow-hidden shadow-2xl z-50',
        'transition-all duration-200 ease-in-out',
        isDragging ? 'cursor-grabbing' : 'cursor-grab',
        className
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '320px',
        height: '180px'
      }}
      onMouseDown={handleMouseDown}
      data-testid="picture-in-picture-view"
    >
      {/* Video Element */}
      <video
        className="w-full h-full object-cover"
        data-media-element
        poster={state.currentMedia.metadata?.thumbnail}
      />

      {/* Drag Handle */}
      <div 
        className="absolute top-2 left-2 opacity-50 hover:opacity-100 transition-opacity"
        data-draggable="true"
      >
        <Move className="h-4 w-4 text-white" />
      </div>

      {/* Controls Overlay */}
      <div 
        className={cn(
          'absolute inset-0 bg-black/50 flex items-center justify-center',
          'transition-opacity duration-200',
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
        <div className="flex items-center space-x-2">
          {/* Play/Pause */}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              state.isPlaying ? onPause() : onPlay();
            }}
            className="text-white hover:bg-white/20 h-8 w-8"
          >
            {state.isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>

          {/* Volume Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onVolumeToggle();
            }}
            className="text-white hover:bg-white/20 h-8 w-8"
          >
            {state.volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>

          {/* Maximize */}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onMaximize();
            }}
            className="text-white hover:bg-white/20 h-8 w-8"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>

          {/* Close */}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-white hover:bg-red-500/80 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
        <div 
          className="h-full bg-white transition-all duration-300"
          style={{ 
            width: `${state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0}%` 
          }}
        />
      </div>

      {/* Loading Indicator */}
      {state.error === null && (
        <div 
          className="absolute inset-0 bg-black/80 flex items-center justify-center"
          data-loading
          style={{ display: 'none' }}
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )}

      {/* Error State */}
      {state.error && (
        <div className="absolute inset-0 bg-red-900/80 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-400 text-2xl mb-2">⚠️</div>
            <p className="text-xs text-red-200">
              Playback Error
            </p>
          </div>
        </div>
      )}

      {/* Media Title */}
      <div 
        className={cn(
          'absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent',
          'p-2 transition-opacity duration-200',
          showControls ? 'opacity-100' : 'opacity-0'
        )}
      >
        <h4 className="text-white text-xs font-medium truncate">
          {state.currentMedia.name}
        </h4>
      </div>
    </div>
  );
}