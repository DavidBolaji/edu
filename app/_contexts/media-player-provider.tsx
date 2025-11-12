'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { MediaItem, PlaybackState } from '@/src/entities/models/media';
import { 
  IMediaState, 
  MediaViewMode, 
  IMediaPlayer,
  MediaPlayerError 
} from '@/src/entities/models/media-player';
import { MediaPlayerCore } from '@/src/application/services/media-player';
import { PlaybackStateManager } from '@/src/application/services/media-player/playback-state-manager';

interface MediaPlayerContextType {
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
  
  // Navigation persistence
  isNavigating: boolean;
  preserveStateOnNavigation: boolean;
  setPreserveStateOnNavigation: (preserve: boolean) => void;
}

const MediaPlayerContext = createContext<MediaPlayerContextType | null>(null);

interface MediaPlayerProviderProps {
  children: React.ReactNode;
  enablePersistence?: boolean;
  enableCrossTabSync?: boolean;
  autoSaveInterval?: number;
}

export function MediaPlayerProvider({
  children,
  enablePersistence = true,
  enableCrossTabSync = true,
  autoSaveInterval = 5000
}: MediaPlayerProviderProps) {
  const pathname = usePathname();
  
  // Core state
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
  const [isNavigating, setIsNavigating] = useState(false);
  const [preserveStateOnNavigation, setPreserveStateOnNavigation] = useState(true);
  
  // Refs for persistent instances
  const playerRef = useRef<IMediaPlayer | null>(null);
  const stateManagerRef = useRef<PlaybackStateManager | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previousPathnameRef = useRef<string>(pathname);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Initialize media player and state manager with navigation persistence
  useEffect(() => {
    const initializePlayer = async () => {
      try {
        // Create persistent container if it doesn't exist
        if (!containerRef.current) {
          // Check if container already exists from previous navigation
          const existingContainer = document.getElementById('global-media-player-container');
          
          if (existingContainer) {
            containerRef.current = existingContainer as HTMLDivElement;
          } else {
            containerRef.current = document.createElement('div');
            containerRef.current.id = 'global-media-player-container';
            containerRef.current.style.cssText = `
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              z-index: 9999;
              pointer-events: none;
              background: transparent;
            `;
            document.body.appendChild(containerRef.current);
          }
        }

        // Initialize state manager
        if (!stateManagerRef.current) {
          stateManagerRef.current = new PlaybackStateManager();
          stateManagerRef.current.enableCrossTabSync(enableCrossTabSync);
        }

        // Initialize media player core
        if (!playerRef.current) {
          playerRef.current = new MediaPlayerCore(containerRef.current, {
            autoSaveInterval,
            enablePictureInPicture: true,
            enableMiniPlayer: true,
            defaultVolume: state.volume / 100,
            defaultPlaybackRate: state.playbackRate
          });

          // Set up player event listeners for state synchronization
          const playerState = playerRef.current.getState();
          if (playerState) {
            setState(prev => ({
              ...prev,
              ...playerState
            }));
          }
        }

        // Set up state restoration listener
        stateManagerRef.current.onStateRestored((restoredState: PlaybackState) => {
          if (preserveStateOnNavigation && playerRef.current) {
            setState(prev => ({
              ...prev,
              currentTime: restoredState.currentTime,
              volume: restoredState.volume * 100,
              playbackRate: restoredState.playbackRate,
              isPlaying: restoredState.isPlaying
            }));
          }
        });

        // Check for existing media state on initialization (page refresh/navigation)
        if (preserveStateOnNavigation) {
          const savedMediaId = sessionStorage.getItem('media-player-current-media-id');
          if (savedMediaId) {
            const restoredState = await stateManagerRef.current.loadState(savedMediaId);
            if (restoredState) {
              // We have a saved state but need the media item to restore properly
              // This will be handled when loadMedia is called with the same media
              console.log('Found saved media state for:', savedMediaId);
            }
          }
        }

      } catch (error) {
        console.error('Failed to initialize media player:', error);
      }
    };

    initializePlayer();

    // Cleanup on unmount
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, [autoSaveInterval, enableCrossTabSync, preserveStateOnNavigation, state.volume, state.playbackRate]);

  // Enhanced navigation event handling for cross-page persistence
  useEffect(() => {
    let navigationStartTime: number | null = null;
    let isInternalNavigation = false;

    const handleNavigationStart = (source: 'pathname' | 'beforeunload' | 'popstate' | 'visibility' | 'focus') => {
      if (!preserveStateOnNavigation || !state.currentMedia) return;

      navigationStartTime = Date.now();
      setIsNavigating(true);
      
      console.log(`[MediaPlayer] Navigation start (${source}):`, {
        mediaId: state.currentMedia.id,
        currentTime: state.currentTime,
        isPlaying: state.isPlaying
      });
      
      // Save current state before navigation with enhanced metadata
      const currentState: PlaybackState = {
        mediaId: state.currentMedia.id,
        currentTime: state.currentTime,
        duration: state.duration,
        volume: state.volume / 100,
        playbackRate: state.playbackRate,
        isPlaying: state.isPlaying,
        lastUpdated: new Date()
      };
      
      // Save state immediately for navigation persistence
      stateManagerRef.current?.saveState(currentState);
      
      // Enhanced media element preservation during navigation
      if (state.isPlaying && containerRef.current) {
        const mediaElement = containerRef.current.querySelector('audio, video') as HTMLMediaElement;
        if (mediaElement && !mediaElement.paused) {
          // Store additional context for better restoration
          sessionStorage.setItem('media-player-continue-playback', 'true');
          sessionStorage.setItem('media-player-navigation-time', currentState.currentTime.toString());
          sessionStorage.setItem('media-player-navigation-source', source);
          
          // Prevent media element from being garbage collected during navigation
          mediaElement.setAttribute('data-preserve-during-navigation', 'true');
        }
      }
    };

    const handleNavigationComplete = (source: 'pathname' | 'popstate' | 'visibility' | 'focus') => {
      // Clear any existing navigation timeout
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }

      // Use adaptive timeout based on navigation type
      const timeout = isInternalNavigation ? 50 : 150;
      
      navigationTimeoutRef.current = setTimeout(async () => {
        const navigationDuration = navigationStartTime ? Date.now() - navigationStartTime : 0;
        
        console.log(`[MediaPlayer] Navigation complete (${source}):`, {
          duration: navigationDuration,
          hasCurrentMedia: !!state.currentMedia
        });
        
        setIsNavigating(false);
        navigationStartTime = null;
        
        // Enhanced state restoration logic
        if (preserveStateOnNavigation && stateManagerRef.current) {
          // First, check if we have a current media to restore
          let mediaIdToRestore = state.currentMedia?.id;
          
          // If no current media, check session storage for persisted media ID
          if (!mediaIdToRestore) {
            const storedMediaId = sessionStorage.getItem('media-player-current-media-id');
            if (storedMediaId) {
              mediaIdToRestore = storedMediaId;
            }
          }
          
          if (mediaIdToRestore) {
            try {
              const restoredState = await stateManagerRef.current.restoreStateOnNavigation(mediaIdToRestore);
              
              if (restoredState) {
                console.log('[MediaPlayer] Restoring state:', restoredState);
                
                // Update local state with restored values
                setState(prev => ({
                  ...prev,
                  currentTime: restoredState.currentTime,
                  volume: restoredState.volume * 100,
                  playbackRate: restoredState.playbackRate,
                  isPlaying: restoredState.isPlaying
                }));
                
                // Apply restored state to player if available
                if (playerRef.current) {
                  // Seek to restored position
                  if (restoredState.currentTime > 0) {
                    playerRef.current.seek(restoredState.currentTime);
                  }
                  
                  // Restore volume and playback rate
                  playerRef.current.setVolume(restoredState.volume);
                  playerRef.current.setPlaybackRate(restoredState.playbackRate);
                  
                  // Handle playback resumption with enhanced logic
                  const shouldContinuePlayback = sessionStorage.getItem('media-player-continue-playback');
                  
                  if (shouldContinuePlayback === 'true' && restoredState.isPlaying) {
                    try {
                      // Add a small delay for DOM stabilization after navigation
                      await new Promise(resolve => setTimeout(resolve, 100));
                      
                      await playerRef.current.play();
                      
                      console.log('[MediaPlayer] Playback resumed after navigation');
                      
                      // Clean up session storage
                      sessionStorage.removeItem('media-player-continue-playback');
                      sessionStorage.removeItem('media-player-navigation-time');
                      sessionStorage.removeItem('media-player-navigation-source');
                      
                    } catch (playError) {
                      console.warn('Failed to resume playback after navigation:', playError);
                      
                      // Update state to reflect actual playing status
                      setState(prev => ({ ...prev, isPlaying: false }));
                    }
                  }
                }
              }
            } catch (error) {
              console.error('Failed to restore state after navigation:', error);
            }
          }
        }
        
        // Clean up navigation markers
        if (containerRef.current) {
          const mediaElements = containerRef.current.querySelectorAll('[data-preserve-during-navigation]');
          mediaElements.forEach(element => {
            element.removeAttribute('data-preserve-during-navigation');
          });
        }
        
        isInternalNavigation = false;
      }, timeout);
    };

    // Enhanced pathname change detection (Next.js App Router)
    if (pathname !== previousPathnameRef.current) {
      isInternalNavigation = true;
      handleNavigationStart('pathname');
      previousPathnameRef.current = pathname;
      handleNavigationComplete('pathname');
    }

    // Enhanced browser navigation events
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      handleNavigationStart('beforeunload');
      
      // Enhanced warning for media playback
      if (state.isPlaying && state.currentMedia) {
        // Modern browsers require preventDefault() and returnValue to be set
        event.preventDefault();
        // Setting returnValue to empty string is the modern standard
        event.returnValue = '';
      }
    };

    const handlePopState = (event: PopStateEvent) => {
      console.log('[MediaPlayer] Browser navigation detected:', event.state);
      handleNavigationStart('popstate');
      setTimeout(() => handleNavigationComplete('popstate'), 50);
    };

    // Enhanced visibility change handling (tab switching, minimizing)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (state.isPlaying && preserveStateOnNavigation) {
          handleNavigationStart('visibility');
        }
      } else {
        if (state.currentMedia && preserveStateOnNavigation) {
          handleNavigationComplete('visibility');
        }
      }
    };

    // Enhanced focus/blur handling for better state management
    const handlePageFocus = () => {
      if (state.currentMedia && preserveStateOnNavigation) {
        handleNavigationComplete('focus');
      }
    };

    const handlePageBlur = () => {
      if (state.currentMedia && preserveStateOnNavigation) {
        handleNavigationStart('focus');
      }
    };

    // Enhanced error handling for navigation events
    const handleError = (event: ErrorEvent) => {
      console.error('[MediaPlayer] Navigation error:', event.error);
      // Reset navigation state on error
      setIsNavigating(false);
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };

    // Add event listeners with enhanced error handling
    try {
      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('popstate', handlePopState);
      window.addEventListener('error', handleError);
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handlePageFocus);
      window.addEventListener('blur', handlePageBlur);
    } catch (error) {
      console.error('[MediaPlayer] Failed to add navigation event listeners:', error);
    }

    return () => {
      try {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('popstate', handlePopState);
        window.removeEventListener('error', handleError);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handlePageFocus);
        window.removeEventListener('blur', handlePageBlur);
      } catch (error) {
        console.error('[MediaPlayer] Failed to remove navigation event listeners:', error);
      }
    };
  }, [pathname, preserveStateOnNavigation, state.currentMedia, state.currentTime, state.duration, state.volume, state.playbackRate, state.isPlaying]);

  // Media loading with navigation persistence support
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
      
      // Store current media ID for navigation persistence
      if (preserveStateOnNavigation) {
        sessionStorage.setItem('media-player-current-media-id', media.id);
      }
      
      // Try to restore previous state for this media
      if (enablePersistence && stateManagerRef.current) {
        const savedState = await stateManagerRef.current.loadState(media.id);
        if (savedState) {
          setState(prev => ({
            ...prev,
            currentTime: savedState.currentTime,
            volume: savedState.volume * 100,
            playbackRate: savedState.playbackRate,
            isPlaying: savedState.isPlaying // Restore playing state
          }));
          
          if (playerRef.current) {
            playerRef.current.seek(savedState.currentTime);
            playerRef.current.setVolume(savedState.volume);
            playerRef.current.setPlaybackRate(savedState.playbackRate);
            
            // Resume playback if it was playing before
            if (savedState.isPlaying) {
              try {
                await playerRef.current.play();
              } catch (playError) {
                console.warn('Could not auto-resume playback:', playError);
                // Update state to reflect actual playing status
                setState(prev => ({ ...prev, isPlaying: false }));
              }
            }
          }
        }
      }
    } catch (error) {
      const mediaError: MediaPlayerError = {
        code: 'LOAD_FAILED' as any,
        message: 'Failed to load media',
        severity: 'high',
        timestamp: new Date(),
        context: { error, mediaId: media.id }
      };
      setState(prev => ({ ...prev, error: mediaError }));
    } finally {
      setIsLoading(false);
    }
  }, [enablePersistence, preserveStateOnNavigation]);

  // Playback controls
  const play = useCallback(async () => {
    if (!playerRef.current) return;
    
    try {
      await playerRef.current.play();
      setState(prev => ({ ...prev, isPlaying: true, error: null }));
    } catch (error) {
      const mediaError: MediaPlayerError = {
        code: 'PLAYBACK_FAILED' as any,
        message: 'Failed to start playback',
        severity: 'medium',
        timestamp: new Date(),
        context: { error }
      };
      setState(prev => ({ ...prev, error: mediaError }));
    }
  }, []);

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
    
    const clampedVolume = Math.max(0, Math.min(100, volume));
    playerRef.current.setVolume(clampedVolume / 100);
    setState(prev => ({ ...prev, volume: clampedVolume }));
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
      if (state.currentMedia.type !== 'VIDEO') {
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
    }
  }, [state.currentMedia]);

  const close = useCallback(async () => {
    if (!playerRef.current) return;
    
    console.log('[MediaPlayerProvider] Closing media player');
    
    // Close the player (stops playback and cleans up current handler)
    playerRef.current.close();
    
    // Clear navigation persistence data
    sessionStorage.removeItem('media-player-current-media-id');
    sessionStorage.removeItem('media-player-continue-playback');
    sessionStorage.removeItem('media-player-navigation-time');
    sessionStorage.removeItem('media-player-navigation-source');
    
    // Clear saved state if we have current media
    if (state.currentMedia && stateManagerRef.current) {
      await stateManagerRef.current.clearState(state.currentMedia.id);
    }
    
    // Reset state
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
    
    console.log('[MediaPlayerProvider] Media player closed');
  }, [state.currentMedia]);

  // Cleanup on unmount with navigation persistence consideration
  useEffect(() => {
    return () => {
      const performCleanup = async () => {
        console.log('[MediaPlayerProvider] Component unmounting, performing cleanup');
        
        // Only cleanup if we're not preserving state for navigation
        if (!preserveStateOnNavigation) {
          // Comprehensive cleanup
          if (playerRef.current) {
            try {
              await playerRef.current.cleanup();
            } catch (error) {
              console.error('Failed to cleanup player:', error);
            }
            playerRef.current = null;
          }
          
          if (stateManagerRef.current) {
            try {
              await stateManagerRef.current.close();
            } catch (error) {
              console.error('Failed to close state manager:', error);
            }
            stateManagerRef.current = null;
          }
          
          if (containerRef.current && containerRef.current.parentNode) {
            containerRef.current.parentNode.removeChild(containerRef.current);
            containerRef.current = null;
          }
          
          // Clear session storage
          sessionStorage.removeItem('media-player-current-media-id');
          sessionStorage.removeItem('media-player-continue-playback');
          sessionStorage.removeItem('media-player-navigation-time');
          sessionStorage.removeItem('media-player-navigation-source');
          
          console.log('[MediaPlayerProvider] Cleanup complete');
        } else {
          // Save current state before unmounting if we have active media
          if (state.currentMedia && stateManagerRef.current) {
            const currentState: PlaybackState = {
              mediaId: state.currentMedia.id,
              currentTime: state.currentTime,
              duration: state.duration,
              volume: state.volume / 100,
              playbackRate: state.playbackRate,
              isPlaying: state.isPlaying,
              lastUpdated: new Date()
            };
            
            try {
              await stateManagerRef.current.saveState(currentState);
              console.log('[MediaPlayerProvider] State saved for navigation');
            } catch (error) {
              console.error('Failed to save state on unmount:', error);
            }
          }
        }
      };

      // Execute cleanup
      performCleanup().catch(error => {
        console.error('Cleanup failed:', error);
      });
    };
  }, [preserveStateOnNavigation, state.currentMedia, state.currentTime, state.duration, state.volume, state.playbackRate, state.isPlaying]);

  const contextValue: MediaPlayerContextType = {
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
    
    // Navigation persistence
    isNavigating,
    preserveStateOnNavigation,
    setPreserveStateOnNavigation
  };

  return (
    <MediaPlayerContext.Provider value={contextValue}>
      {children}
    </MediaPlayerContext.Provider>
  );
}

export function useMediaPlayer() {
  const context = useContext(MediaPlayerContext);
  if (!context) {
    throw new Error('useMediaPlayer must be used within a MediaPlayerProvider');
  }
  return context;
}