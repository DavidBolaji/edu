'use client';

import React, { useState } from 'react';
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
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { IMediaState } from '@/src/entities/models/media-player';
import { MediaType } from '@/src/entities/models/media';

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

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    
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
        return '🎥';
      case MediaType.AUDIO:
        return '🎵';
      case MediaType.EBOOK:
        return '📖';
      default:
        return '📄';
    }
  };

  if (!state.currentMedia) {
    return null;
  }

  return (
    <Card 
      className={cn(
        'fixed bottom-4 right-4 bg-white dark:bg-gray-900 shadow-lg border',
        'transition-all duration-300 ease-in-out z-50',
        isExpanded ? 'w-80' : 'w-72',
        className
      )}
      data-testid="mini-player-view"
    >
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
        <div 
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${getProgressPercentage()}%` }}
        />
      </div>

      <div className="p-3">
        {/* Main Content */}
        <div className="flex items-center space-x-3">
          {/* Media Thumbnail/Icon */}
          <div className="flex-shrink-0">
            {state.currentMedia.type === MediaType.VIDEO && state.currentMedia.metadata?.thumbnail ? (
              <img
                src={state.currentMedia.metadata.thumbnail}
                alt={state.currentMedia.name}
                className="w-12 h-12 rounded object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xl">
                {getMediaTypeIcon()}
              </div>
            )}
          </div>

          {/* Media Info */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium truncate">
              {state.currentMedia.name}
            </h4>
            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
              <span>{formatTime(state.currentTime)}</span>
              <span>/</span>
              <span>{formatTime(state.duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center space-x-1">
            {/* Play/Pause */}
            <Button
              variant="ghost"
              size="icon"
              onClick={state.isPlaying ? onPause : onPlay}
              className="h-8 w-8"
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
              onClick={onVolumeToggle}
              className="h-8 w-8"
            >
              {state.volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>

            {/* Expand/Collapse */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>

            {/* Maximize */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onMaximize}
              className="h-8 w-8"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>

            {/* Close */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-gray-500 hover:text-red-500"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            {/* Media Description */}
            {state.currentMedia.metadata?.description && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {state.currentMedia.metadata.description}
              </p>
            )}

            {/* Additional Info */}
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span className="capitalize">
                {state.currentMedia.type} • {state.currentMedia.format?.toUpperCase()}
              </span>
              <span>
                {state.currentMedia.size && (
                  `${(state.currentMedia.size / (1024 * 1024)).toFixed(1)} MB`
                )}
              </span>
            </div>

            {/* Playback Rate (for audio/video) */}
            {state.currentMedia.type !== MediaType.EBOOK && (
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Speed: {state.playbackRate}x
                </span>
                <div className="flex space-x-1">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      className={cn(
                        'px-2 py-1 text-xs rounded',
                        state.playbackRate === rate
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                      )}
                      onClick={() => {
                        // This would need to be passed as a prop
                        console.log(`Set playback rate to ${rate}`);
                      }}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>
            )}
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