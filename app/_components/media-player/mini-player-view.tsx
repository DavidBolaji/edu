'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/app/_lib/utils';
import { Button } from '@/app/_components/ui/button';
import { Card } from '@/app/_components/ui/card';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  X,
  Music,
  Video,
  BookOpen
} from 'lucide-react';
import { IMediaState } from '@/src/entities/models/media-player';
import { MediaType } from '@/src/entities/models/media';
import Image from 'next/image';

interface MiniPlayerViewProps {
  state: IMediaState;
  onPlay: () => void;
  onPause: () => void;
  onVolumeToggle: () => void;
  onMaximize: () => void;
  onClose: () => void;
  className?: string;
}

export function MiniPlayerView({
  state,
  onPlay,
  onPause,
  onVolumeToggle,
  onMaximize,
  onClose,
  className
}: MiniPlayerViewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Initialize position to bottom-right
  useEffect(() => {
    if (cardRef.current && position.x === 0 && position.y === 0) {
      const rect = cardRef.current.getBoundingClientRect();
      setPosition({
        x: window.innerWidth - rect.width - 16,
        y: window.innerHeight - rect.height - 16
      });
    }
  }, [position.x, position.y]);
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return; // Don't drag when clicking buttons
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      // Keep within viewport bounds
      const maxX = window.innerWidth - (cardRef.current?.offsetWidth || 288);
      const maxY = window.innerHeight - (cardRef.current?.offsetHeight || 200);
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
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
  }, [isDragging, dragStart]);

  const formatTime = (seconds: number): string => {
    // Handle invalid values (NaN, Infinity, negative)
    if (!isFinite(seconds) || seconds < 0 || isNaN(seconds)) {
      return '--:--';
    }
    
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = (): number => {
    if (!state.duration || state.duration === 0) return 0;
    return (state.currentTime / state.duration) * 100;
  };

  const getMediaTypeIcon = () => {
    switch (state.currentMedia?.type) {
      case MediaType.VIDEO:
        return <Video className="h-5 w-5 text-blue-500" />;
      case MediaType.AUDIO:
        return <Music className="h-5 w-5 text-green-500" />;
      case MediaType.EBOOK:
        return <BookOpen className="h-5 w-5 text-orange-500" />;
      default:
        return <Music className="h-5 w-5 text-gray-500" />;
    }
  };

  if (!state.currentMedia) {
    return null;
  }

  return (
    <Card 
      ref={cardRef}
      className={cn(
        'fixed bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-xl border-0',
        'transition-all duration-300 ease-in-out z-50 rounded-xl overflow-hidden',
        isExpanded ? 'w-80' : 'w-72',
        isDragging ? 'cursor-grabbing scale-105' : 'cursor-grab hover:shadow-2xl',
        className
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onMouseDown={handleMouseDown}
      data-testid="mini-player-view"
    >
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 shadow-sm"
          style={{ width: `${getProgressPercentage()}%` }}
        />
      </div>

      <div className="p-4">
        {/* Main Content */}
        <div className="flex items-center space-x-3">
          {/* Media Thumbnail/Icon */}
          <div className="flex-shrink-0">
            {state.currentMedia.type === MediaType.VIDEO && state.currentMedia.metadata?.thumbnail ? (
              <Image
                src={state.currentMedia.metadata.thumbnail}
                alt={state.currentMedia.name}
                width={80}
                height={80}
                className="w-8 h-8 rounded-lg object-cover shadow-sm"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center shadow-sm">
                {getMediaTypeIcon()}
              </div>
            )}
          </div>

          {/* Media Info */}
          <div className="flex-1 min-w-0">
            <h4 className="text-xs mt-5 font-semibold text-gray-900 dark:text-white truncate mb-1">
              {state.currentMedia.name}
            </h4>
            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 translate-y-3">
              <span className="font-mono">{formatTime(state.currentTime)}</span>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <span className="font-mono">{formatTime(state.duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center space-x-1">
            {/* Play/Pause */}
            <Button
              variant="ghost"
              size="icon"
              onClick={state.isPlaying ? onPause : onPlay}
              className="h-9 w-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {state.isPlaying ? (
                <Pause className="h-4 w-4 text-gray-700 dark:text-gray-300" />
              ) : (
                <Play className="h-4 w-4 text-gray-700 dark:text-gray-300 ml-0.5" />
              )}
            </Button>

            {/* Volume Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onVolumeToggle}
              className="h-9 w-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {state.volume === 0 ? (
                <VolumeX className="h-4 w-4 text-gray-700 dark:text-gray-300" />
              ) : (
                <Volume2 className="h-4 w-4 text-gray-700 dark:text-gray-300" />
              )}
            </Button>

            {/* Maximize */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onMaximize}
              className="h-9 w-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Maximize2 className="h-4 w-4 text-gray-700 dark:text-gray-300" />
            </Button>

            {/* Close */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-9 w-9 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group"
            >
              <X className="h-4 w-4 text-gray-500 group-hover:text-red-500 transition-colors" />
            </Button>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            {/* Media Description */}
            {state.currentMedia.metadata?.description && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 leading-relaxed">
                {state.currentMedia.metadata.description}
              </p>
            )}

            {/* Additional Info */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                <span className="text-gray-500 dark:text-gray-400 block">Type</span>
                <span className="font-medium text-gray-900 dark:text-white capitalize">
                  {state.currentMedia.type}
                </span>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                <span className="text-gray-500 dark:text-gray-400 block">Format</span>
                <span className="font-medium text-gray-900 dark:text-white uppercase">
                  {state.currentMedia.format || 'Unknown'}
                </span>
              </div>
              {state.currentMedia.size && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 col-span-2">
                  <span className="text-gray-500 dark:text-gray-400 block">Size</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {(state.currentMedia.size / (1024 * 1024)).toFixed(1)} MB
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Loading Indicator */}
      {state.error === null && (
        <div 
          className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center rounded"
          data-loading
          style={{ display: 'none' }}
        >
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Error State */}
      {state.error && (
        <div className="absolute inset-0 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 rounded flex items-center justify-center">
          <div className="text-center p-4">
            <div className="text-red-500 text-lg mb-1">⚠️</div>
            <p className="text-xs text-red-600 dark:text-red-400">
              Playback Error
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}