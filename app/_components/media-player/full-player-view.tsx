'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/app/_lib/utils';
import { Button } from '@/app/_components/ui/button';
import { Slider } from '@/app/_components/ui/slider';
import { Card } from '@/app/_components/ui/card';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Minimize2,
  SkipBack,
  SkipForward,
  Settings,
  X
} from 'lucide-react';
import { IMediaState, MediaViewMode } from '@/src/entities/models/media-player';
import { MediaItem, MediaType } from '@/src/entities/models/media';
import { EbookViewer } from './ebook-viewer';

interface FullPlayerViewProps {
  state: IMediaState;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (position: number) => void;
  onVolumeChange: (volume: number) => void;
  onMinimize: () => void;
  onClose: () => void;
  onPictureInPicture?: () => void;
  className?: string;
}

export function FullPlayerView({
  state,
  onPlay,
  onPause,
  onSeek,
  onVolumeChange,
  onMinimize,
  onClose,
  onPictureInPicture,
  className
}: FullPlayerViewProps) {
  const [showControls, setShowControls] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(state.volume);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-hide controls for video content
  useEffect(() => {
    if (state.currentMedia?.type === MediaType.VIDEO) {
      const resetTimeout = () => {
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
        setShowControls(true);
        controlsTimeoutRef.current = setTimeout(() => {
          if (state.isPlaying) {
            setShowControls(false);
          }
        }, 3000);
      };

      const handleMouseMove = () => resetTimeout();
      const handleMouseLeave = () => {
        if (state.isPlaying) {
          setShowControls(false);
        }
      };

      const container = containerRef.current;
      if (container) {
        container.addEventListener('mousemove', handleMouseMove);
        container.addEventListener('mouseleave', handleMouseLeave);
        resetTimeout();
      }

      return () => {
        if (container) {
          container.removeEventListener('mousemove', handleMouseMove);
          container.removeEventListener('mouseleave', handleMouseLeave);
        }
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
      };
    } else {
      setShowControls(true);
    }
  }, [state.currentMedia?.type, state.isPlaying]);

  const handleToggleMute = () => {
    if (isMuted) {
      onVolumeChange(previousVolume);
      setIsMuted(false);
    } else {
      setPreviousVolume(state.volume);
      onVolumeChange(0);
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const volume = value[0];
    onVolumeChange(volume);
    setIsMuted(volume === 0);
    if (volume > 0) {
      setPreviousVolume(volume);
    }
  };

  const handleSeek = (value: number[]) => {
    const position = value[0];
    onSeek(position);
  };

  const formatTime = (seconds: number): string => {
    // Handle invalid values (NaN, Infinity, negative)
    if (!isFinite(seconds) || seconds < 0 || isNaN(seconds)) {
      return '--:--';
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
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
      ref={containerRef}
      className={cn(
        'relative w-full h-full bg-black text-white overflow-hidden',
        'flex flex-col',
        className
      )}
      data-testid="full-player-view"
    >
      {/* Media Content Area */}
      <div className="flex-1 relative flex items-center justify-center">
        {state.currentMedia.type === MediaType.VIDEO && (
          <div 
            className="w-full h-full flex items-center justify-center bg-black relative"
            data-video-placeholder
            data-media-id={state.currentMedia.id}
            style={{ minHeight: '400px' }}
          >
            {/* Video element will be transferred here by MediaPlayerProvider */}
            <div 
              className={`text-gray-500 text-sm absolute inset-0 flex items-center justify-center pointer-events-none z-10 transition-opacity duration-300 ${
                state.currentMedia && state.duration > 0 ? 'opacity-0' : 'opacity-100'
              }`}
            >
              Loading video...
            </div>
          </div>
        )}

        {state.currentMedia.type === MediaType.AUDIO && (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="text-6xl">{getMediaTypeIcon()}</div>
            <div className="text-center">
              <h3 className="text-xl font-semibold">{state.currentMedia.name}</h3>
              {state.currentMedia.metadata?.description && (
                <p className="text-sm text-gray-400 mt-2">
                  {state.currentMedia.metadata.description}
                </p>
              )}
            </div>
          </div>
        )}

        {state.currentMedia.type === MediaType.EBOOK && (
          <EbookViewer
            media={state.currentMedia}
            onTimeUpdate={(time) => {
              // Update progress through onSeek
              onSeek(time * state.duration);
            }}
            onError={(error) => {
              console.error('Ebook viewer error:', error);
            }}
            className="w-full h-full"
          />
        )}

        {/* Loading Overlay */}
        {state.error === null && (
          <div
            className={cn(
              'absolute inset-0 bg-black/50 flex items-center justify-center',
              'transition-opacity duration-300'
            )}
            data-loading
            style={{ display: 'none' }}
          >
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        )}

        {/* Error Overlay */}
        {state.error ? (
          state.currentMedia.type === "EBOOK" && state.error.message === "Failed to start playback" ? null :
            <div
              className="absolute inset-0 bg-black/80 flex items-center justify-center"
              data-error
            >
              <div className="text-center">
                <div className="text-red-500 text-4xl mb-4">⚠️</div>
                <h3 className="text-xl font-semibold mb-2">Playback Error</h3>
                <p className="text-gray-400" data-error-message>
                  {state.error.message}
                </p>
              </div>
            </div>
        ) : null}
      </div>

      {/* Controls Overlay */}
      <div
          className={cn(
            'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent',
            'p-6 transition-opacity duration-300 z-50',
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
          data-controls
        >
          {/* Progress Bar - Only for audio/video */}
          {state.currentMedia.type !== MediaType.EBOOK && (
            <div className="mb-4">
              <Slider
                value={[state.currentTime]}
                max={state.duration > 0 && isFinite(state.duration) ? state.duration : 100}
                step={1}
                onValueChange={handleSeek}
                disabled={!state.duration || state.duration <= 0 || !isFinite(state.duration)}
                className="w-full"
                data-progress-bar
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span data-current-time>{formatTime(state.currentTime)}</span>
                <span data-duration>{formatTime(state.duration)}</span>
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Play/Pause - Only for audio/video */}
              {state.currentMedia.type !== MediaType.EBOOK && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={state.isPlaying ? onPause : onPlay}
                  className="text-white hover:bg-white/20"
                >
                  {state.isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6" />
                  )}
                </Button>
              )}

              {/* Skip buttons for audio/video */}
              {state.currentMedia.type !== MediaType.EBOOK && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onSeek(Math.max(0, state.currentTime - 10))}
                    className="text-white hover:bg-white/20"
                  >
                    <SkipBack className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onSeek(Math.min(state.duration, state.currentTime + 10))}
                    className="text-white hover:bg-white/20"
                  >
                    <SkipForward className="h-5 w-5" />
                  </Button>
                </>
              )}

              {/* Volume Control */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleMute}
                  className="text-white hover:bg-white/20"
                >
                  {isMuted || state.volume === 0 ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>
                <Slider
                  value={[isMuted ? 0 : state.volume]}
                  max={100}
                  step={1}
                  onValueChange={handleVolumeChange}
                  className="w-20"
                />
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-2">
              {/* Settings */}
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
              >
                <Settings className="h-5 w-5" />
              </Button>

              {/* Minimize - Only for audio */}
              {state.currentMedia?.type === MediaType.AUDIO && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onMinimize}
                  className="text-white hover:bg-white/20"
                >
                  <Minimize2 className="h-5 w-5" />
                </Button>
              )}

              {/* Close */}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

      {/* Title Bar */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent',
          'p-4 transition-opacity duration-300 z-50',
          showControls ? 'opacity-100' : 'opacity-0'
        )}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold truncate">
              {state.currentMedia.name}
            </h2>
            {state.currentMedia.metadata?.description && (
              <p className="text-sm text-gray-400 truncate">
                {state.currentMedia.metadata.description}
              </p>
            )}
          </div>
          <div className="text-sm text-gray-400">
            {getMediaTypeIcon()} {state.currentMedia.type.toUpperCase()}
          </div>
        </div>
      </div>
    </Card>
  );
}