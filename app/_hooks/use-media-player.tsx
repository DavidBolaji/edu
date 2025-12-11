'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  IMediaState,
  MediaViewMode,
  IMediaPlayer,
  MediaPlayerError
} from '@/src/entities/models/media-player';
import { MediaItem, MediaType } from '@/src/entities/models/media';
import { MediaPlayerCore } from '@/src/application/services/media-player';

interface UseMediaPlayerOptions {
  autoSaveInterval?: number;
  enablePersistence?: boolean;
  enableCrossTabSync?: boolean;
  onError?: (error: MediaPlayerError) => void;
  onStateChange?: (state: IMediaState) => void;
}

interface UseMediaPlayerReturn {
  // State
  state: IMediaState;
  viewMode: MediaViewMode;
  isLoading: boolean;

  // Actions
  loadMedia: (media: MediaItem) => Promise<void>;
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  seek: (position: number) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;

  // View Mode Controls
  minimize: () => void;
  maximize: () => void;
  pictureInPicture: () => Promise<void>;
  close: () => void;

  // Player Instance
  player: IMediaPlayer | null;
}

export function useMediaPlayer(options: UseMediaPlayerOptions = {}): UseMediaPlayerReturn {
  const {
    autoSaveInterval = 5000,
    enablePersistence = true,
    enableCrossTabSync = true,
    onError,
    onStateChange
  } = options;

  const [state, setState] = useState<IMediaState>({
    currentMedia: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 75,
    playbackRate: 1,
    isMinimized: false,
    isPictureInPicture: false,
    error: null
  });

  const [viewMode, setViewMode] = useState<MediaViewMode>(MediaViewMode.HIDDEN);
  const [isLoading, setIsLoading] = useState(false);

  const playerRef = useRef<IMediaPlayer | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Initialize media player
  useEffect(() => {
    const initializePlayer = async () => {
      try {
        // Create container element if it doesn't exist
        if (!containerRef.current) {
          containerRef.current = document.createElement('div');
          containerRef.current.id = 'media-player-container';
          document.body.appendChild(containerRef.current);
        }

        // Initialize the media player core
        const player = new MediaPlayerCore(containerRef.current, {
          autoSaveInterval,
          enablePictureInPicture: true,
          enableMiniPlayer: true,
          defaultVolume: state.volume,
          defaultPlaybackRate: state.playbackRate
        });

        playerRef.current = player;

        // Set up event listeners for state synchronization
        // This would be implemented based on the MediaPlayerCore interface

      } catch (error) {
        console.error('Failed to initialize media player:', error);
        onError?.({
          code: 'INITIALIZATION_FAILED' as any,
          message: 'Failed to initialize media player',
          severity: 'critical',
          timestamp: new Date(),
          context: { error }
        });
      }
    };

    initializePlayer();

    // Cleanup on unmount
    return () => {
      if (playerRef.current) {
        playerRef.current.stop();
      }
      if (containerRef.current && containerRef.current.parentNode) {
        containerRef.current.parentNode.removeChild(containerRef.current);
      }
    };
  }, [autoSaveInterval, onError, state.volume, state.playbackRate]);

  // Notify parent of state changes
  useEffect(() => {
    onStateChange?.(state);
  }, [state, onStateChange]);

  // Media loading
  const loadMedia = useCallback(async (media: MediaItem) => {
    if (!playerRef.current) return;

    setIsLoading(true);
    try {
      await playerRef.current.load(media);
      setState(prev => ({
        ...prev,
        currentMedia: media,
        currentTime: 0,
        isPlaying: false,
        error: null
      }));
      setViewMode(MediaViewMode.FULL);
    } catch (error) {
      const mediaError: MediaPlayerError = {
        code: 'LOAD_FAILED' as any,
        message: 'Failed to load media',
        severity: 'high',
        timestamp: new Date(),
        context: { error, mediaId: media.id }
      };
      setState(prev => ({ ...prev, error: mediaError }));
      onError?.(mediaError);
    } finally {
      setIsLoading(false);
    }
  }, [onError]);

  // Playback controls
  const play = useCallback(async () => {
    if (!playerRef.current) return;

    try {
      if (state.currentMedia?.type !== "EBOOK") {
        await playerRef.current.play();
        setState(prev => ({ ...prev, isPlaying: true, error: null }));
      }
    } catch (error) {
      const mediaError: MediaPlayerError = {
        code: 'PLAYBACK_FAILED' as any,
        message: 'Failed to start playback',
        severity: 'medium',
        timestamp: new Date(),
        context: { error }
      };
      setState(prev => ({ ...prev, error: mediaError }));
      onError?.(mediaError);
    }
  }, [onError]);

  const pause = useCallback(() => {
    if (!playerRef.current) return;

    playerRef.current.pause();
    setState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  const stop = useCallback(() => {
    if (!playerRef.current) return;

    playerRef.current.stop();
    setState(prev => ({
      ...prev,
      isPlaying: false,
      currentTime: 0,
      currentMedia: null
    }));
    setViewMode(MediaViewMode.HIDDEN);
  }, []);

  const seek = useCallback((position: number) => {
    if (!playerRef.current) return;

    playerRef.current.seek(position);
    setState(prev => ({ ...prev, currentTime: position }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (!playerRef.current) return;

    playerRef.current.setVolume(volume);
    setState(prev => ({ ...prev, volume }));
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    if (!playerRef.current) return;

    playerRef.current.setPlaybackRate(rate);
    setState(prev => ({ ...prev, playbackRate: rate }));
  }, []);

  // View mode controls
  const minimize = useCallback(() => {
    if (!playerRef.current) return;

    playerRef.current.minimize();
    setViewMode(MediaViewMode.MINI);
    setState(prev => ({
      ...prev,
      isMinimized: true,
      isPictureInPicture: false
    }));
  }, []);

  const maximize = useCallback(() => {
    if (!playerRef.current) return;

    playerRef.current.maximize();
    setViewMode(MediaViewMode.FULL);
    setState(prev => ({
      ...prev,
      isMinimized: false,
      isPictureInPicture: false
    }));
  }, []);

  const pictureInPicture = useCallback(async () => {
    if (!playerRef.current || !state.currentMedia) return;

    try {
      // Picture-in-picture is typically only available for video
      if (state.currentMedia.type !== MediaType.VIDEO) {
        throw new Error('Picture-in-picture only available for video content');
      }

      setViewMode(MediaViewMode.PICTURE_IN_PICTURE);
      setState(prev => ({
        ...prev,
        isPictureInPicture: true,
        isMinimized: false
      }));
    } catch (error) {
      const mediaError: MediaPlayerError = {
        code: 'UNKNOWN_ERROR' as any,
        message: 'Picture-in-picture mode not supported',
        severity: 'low',
        timestamp: new Date(),
        context: { error }
      };
      setState(prev => ({ ...prev, error: mediaError }));
      onError?.(mediaError);
    }
  }, [state.currentMedia, onError]);

  const close = useCallback(() => {
    if (!playerRef.current) return;

    playerRef.current.close();
    setState(prev => ({
      ...prev,
      currentMedia: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      error: null,
      isMinimized: false,
      isPictureInPicture: false
    }));
    setViewMode(MediaViewMode.HIDDEN);
  }, []);

  return {
    // State
    state,
    viewMode,
    isLoading,

    // Actions
    loadMedia,
    play,
    pause,
    stop,
    seek,
    setVolume,
    setPlaybackRate,

    // View Mode Controls
    minimize,
    maximize,
    pictureInPicture,
    close,

    // Player Instance
    player: playerRef.current
  };
}