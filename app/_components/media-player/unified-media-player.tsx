'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { cn } from '@/app/_lib/utils';
import { FullPlayerView } from './full-player-view';
import { MiniPlayerView } from './mini-player-view';
import { PictureInPictureView } from './picture-in-picture-view';
import { 
  IMediaState, 
  MediaViewMode, 
  IMediaPlayer,
  MediaPlayerError,
  MediaErrorCode
} from '@/src/entities/models/media-player';
import { MediaItem, MediaType } from '@/src/entities/models/media';

interface UnifiedMediaPlayerProps {
  mediaPlayer?: IMediaPlayer;
  initialMedia?: MediaItem;
  initialViewMode?: MediaViewMode;
  onStateChange?: (state: IMediaState) => void;
  onViewModeChange?: (mode: MediaViewMode) => void;
  onClose?: () => void;
  className?: string;
}

function UnifiedMediaPlayer({
  mediaPlayer,
  initialMedia,
  initialViewMode = MediaViewMode.FULL,
  onStateChange,
  onViewModeChange,
  onClose,
  className
}: UnifiedMediaPlayerProps) {
  const [state, setState] = useState<IMediaState>({
    currentMedia: initialMedia || null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 75,
    playbackRate: 1,
    isMinimized: initialViewMode === MediaViewMode.MINI,
    isPictureInPicture: initialViewMode === MediaViewMode.PICTURE_IN_PICTURE,
    error: null
  });

  const [viewMode, setViewMode] = useState<MediaViewMode>(initialViewMode);
  const [previousVolume, setPreviousVolume] = useState(75);

  // Notify parent components of state changes
  useEffect(() => {
    onStateChange?.(state);
  }, [state, onStateChange]);

  useEffect(() => {
    onViewModeChange?.(viewMode);
  }, [viewMode, onViewModeChange]);

  // Media player event handlers
  const handlePlay = useCallback(async () => {
    if (!mediaPlayer || !state.currentMedia) return;
    
    try {
      await mediaPlayer.play();
      setState(prev => ({ ...prev, isPlaying: true, error: null }));
    } catch (error) {
      const mediaError: MediaPlayerError = {
        code: MediaErrorCode.PLAYBACK_FAILED,
        message: 'Failed to start playback',
        severity: 'medium',
        timestamp: new Date(),
        context: { error }
      };
      setState(prev => ({ ...prev, error: mediaError, isPlaying: false }));
    }
  }, [mediaPlayer, state.currentMedia]);

  const handlePause = useCallback(() => {
    if (!mediaPlayer) return;
    
    mediaPlayer.pause();
    setState(prev => ({ ...prev, isPlaying: false }));
  }, [mediaPlayer]);

  const handleSeek = useCallback((position: number) => {
    if (!mediaPlayer) return;
    
    mediaPlayer.seek(position);
    setState(prev => ({ ...prev, currentTime: position }));
  }, [mediaPlayer]);

  const handleVolumeChange = useCallback((volume: number) => {
    if (!mediaPlayer) return;
    
    mediaPlayer.setVolume(volume);
    setState(prev => ({ ...prev, volume }));
    
    if (volume > 0) {
      setPreviousVolume(volume);
    }
  }, [mediaPlayer]);

  const handleVolumeToggle = useCallback(() => {
    if (state.volume === 0) {
      handleVolumeChange(previousVolume);
    } else {
      setPreviousVolume(state.volume);
      handleVolumeChange(0);
    }
  }, [state.volume, previousVolume, handleVolumeChange]);

  const handleMinimize = useCallback(() => {
    setViewMode(MediaViewMode.MINI);
    setState(prev => ({ 
      ...prev, 
      isMinimized: true, 
      isPictureInPicture: false 
    }));
  }, []);

  const handleMaximize = useCallback(() => {
    setViewMode(MediaViewMode.FULL);
    setState(prev => ({ 
      ...prev, 
      isMinimized: false, 
      isPictureInPicture: false 
    }));
  }, []);

  const handlePictureInPicture = useCallback(async () => {
    if (state.currentMedia?.type !== MediaType.VIDEO) return;
    
    try {
      setViewMode(MediaViewMode.PICTURE_IN_PICTURE);
      setState(prev => ({ 
        ...prev, 
        isPictureInPicture: true, 
        isMinimized: false 
      }));
    } catch (error) {
      const mediaError: MediaPlayerError = {
        code: MediaErrorCode.UNKNOWN_ERROR,
        message: 'Picture-in-picture mode not supported',
        severity: 'low',
        timestamp: new Date(),
        context: { error }
      };
      setState(prev => ({ ...prev, error: mediaError }));
    }
  }, [state.currentMedia?.type]);

  const handleClose = useCallback(() => {
    if (mediaPlayer) {
      mediaPlayer.stop();
    }
    
    setState(prev => ({ 
      ...prev, 
      currentMedia: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      error: null
    }));
    
    setViewMode(MediaViewMode.HIDDEN);
    onClose?.();
  }, [mediaPlayer, onClose]);

  const handleLoadMedia = useCallback(async (media: MediaItem) => {
    if (!mediaPlayer) return;
    
    try {
      setState(prev => ({ ...prev, error: null }));
      await mediaPlayer.load(media);
      setState(prev => ({ 
        ...prev, 
        currentMedia: media,
        currentTime: 0,
        isPlaying: false,
        error: null
      }));
    } catch (error) {
      const mediaError: MediaPlayerError = {
        code: MediaErrorCode.LOAD_FAILED,
        message: 'Failed to load media',
        severity: 'high',
        timestamp: new Date(),
        context: { error, mediaId: media.id }
      };
      setState(prev => ({ ...prev, error: mediaError }));
    }
  }, [mediaPlayer]);

  // Expose methods for external control
  const playerControls = {
    loadMedia: handleLoadMedia,
    play: handlePlay,
    pause: handlePause,
    seek: handleSeek,
    setVolume: handleVolumeChange,
    minimize: handleMinimize,
    maximize: handleMaximize,
    pictureInPicture: handlePictureInPicture,
    close: handleClose,
    getState: () => state,
    getViewMode: () => viewMode
  };

  // Don't render if no media or hidden
  if (!state.currentMedia || viewMode === MediaViewMode.HIDDEN) {
    return null;
  }

  return (
    <div className={cn('media-player-container', className)}>
      {/* Full Player View */}
      {viewMode === MediaViewMode.FULL && (
        <FullPlayerView
          state={state}
          onPlay={handlePlay}
          onPause={handlePause}
          onSeek={handleSeek}
          onVolumeChange={handleVolumeChange}
          onMinimize={handleMinimize}
          onClose={handleClose}
          onPictureInPicture={
            state.currentMedia.type === MediaType.VIDEO 
              ? handlePictureInPicture 
              : undefined
          }
        />
      )}

      {/* Mini Player View */}
      {viewMode === MediaViewMode.MINI && (
        <MiniPlayerView
          state={state}
          onPlay={handlePlay}
          onPause={handlePause}
          onVolumeToggle={handleVolumeToggle}
          onMaximize={handleMaximize}
          onClose={handleClose}
        />
      )}

      {/* Picture-in-Picture View */}
      {viewMode === MediaViewMode.PICTURE_IN_PICTURE && (
        <PictureInPictureView
          state={state}
          onPlay={handlePlay}
          onPause={handlePause}
          onVolumeToggle={handleVolumeToggle}
          onMaximize={handleMaximize}
          onClose={handleClose}
        />
      )}
    </div>
  );
}

// Export the player controls interface for external use
export type MediaPlayerControls = {
  loadMedia: (media: MediaItem) => Promise<void>;
  play: () => Promise<void>;
  pause: () => void;
  seek: (position: number) => void;
  setVolume: (volume: number) => void;
  minimize: () => void;
  maximize: () => void;
  pictureInPicture: () => Promise<void>;
  close: () => void;
  getState: () => IMediaState;
  getViewMode: () => MediaViewMode;
};

export { UnifiedMediaPlayer };