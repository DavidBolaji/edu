'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { MediaItem, PlaybackState, MediaType } from '@/src/entities/models/media';
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
  
  // Playlist State
  playlist: MediaItem[];
  currentIndex: number;
  hasNext: boolean;
  hasPrevious: boolean;
  
  // Actions
  loadMedia: (media: MediaItem) => Promise<void>;
  loadPlaylist: (media: MediaItem[], startIndex: number) => Promise<void>;
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  seek: (position: number) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  
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
  
  // Playlist state
  const [playlist, setPlaylist] = useState<MediaItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  
  // Refs for persistent instances
  const playerRef = useRef<IMediaPlayer | null>(null);
  const stateManagerRef = useRef<PlaybackStateManager | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previousPathnameRef = useRef<string>(pathname);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Simplified video transfer function
  const transferVideoElement = useCallback(async (context: string = '') => {
    if (!containerRef.current) {
      console.error(`[MediaPlayerProvider] No container ref (${context})`);
      return false;
    }

    console.log(`[MediaPlayerProvider] Starting video transfer (${context})`);
    
    // Simple approach: wait a bit then try to find and transfer
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const videoElement = containerRef.current.querySelector('video') as HTMLVideoElement;
    const videoPlaceholder = document.querySelector('[data-video-placeholder]') as HTMLElement;
    
    console.log(`[MediaPlayerProvider] Found video element: ${!!videoElement}, placeholder: ${!!videoPlaceholder} (${context})`);
    
    if (!videoElement) {
      console.error(`[MediaPlayerProvider] Video element not found (${context})`);
      return false;
    }

    if (!videoPlaceholder) {
      console.warn(`[MediaPlayerProvider] Video placeholder not found, using fallback (${context})`);
      // Fallback: show video in global container
      containerRef.current.style.display = 'block';
      containerRef.current.style.pointerEvents = 'auto';
      containerRef.current.style.zIndex = '45';
      
      videoElement.style.position = 'fixed';
      videoElement.style.top = '50%';
      videoElement.style.left = '50%';
      videoElement.style.transform = 'translate(-50%, -50%)';
      videoElement.style.maxWidth = '90vw';
      videoElement.style.maxHeight = '90vh';
      videoElement.style.zIndex = '45';
      videoElement.style.objectFit = 'contain';
      videoElement.style.backgroundColor = 'black';
      return true;
    }

    // Clear placeholder and transfer video
    videoPlaceholder.innerHTML = '';
    videoPlaceholder.appendChild(videoElement);
    
    // Style video element
    videoElement.style.cssText = `
      width: 100% !important;
      height: 100% !important;
      object-fit: contain !important;
      background-color: black !important;
      display: block !important;
      position: relative !important;
      z-index: 1 !important;
    `;
    
    // Hide global container
    containerRef.current.style.display = 'none';
    containerRef.current.style.pointerEvents = 'none';
    
    console.log(`[MediaPlayerProvider] Video element transferred successfully (${context})`);
    return true;
  }, []);
  
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
              z-index: 40;
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
        if (stateManagerRef.current) {
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
        }

        // Check for existing media state on initialization (page refresh/navigation)
        if (preserveStateOnNavigation && stateManagerRef.current) {
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
    
    // Cleanup previous blob URL if it exists
    if (state.currentMedia?.url && state.currentMedia.url.startsWith('blob:')) {
      try {
        const { cleanupBlobUrl } = await import('@/app/_lib/offline-media-utils');
        cleanupBlobUrl(state.currentMedia.url);
      } catch (error) {
        console.error('[MediaPlayerProvider] Failed to cleanup previous blob URL:', error);
      }
    }
    
    // Show modal immediately with loading state
    setViewMode(MediaViewMode.FULL);
    setIsLoading(true);
    
    // For video in FULL mode, we need to show the global container temporarily
    // so VideoController can create the video element, then we'll move it to the modal
    if (containerRef.current) {
      containerRef.current.style.display = 'block';
      containerRef.current.style.pointerEvents = 'none'; // Avoid blocking modal clicks
      containerRef.current.style.zIndex = '30'; // Below modal but above other content
    }
    
    // Set media info immediately so modal shows content
    setState(prev => ({
      ...prev,
      currentMedia: media,
      currentTime: 0,
      isPlaying: false,
      error: null
    }));
    
    try {
      // Skip MediaPlayerCore for ebooks - they're handled by EbookViewer component
      if (media.type !== 'EBOOK') {
        await playerRef.current.load(media);
      }
      
      // Clear loading state after media is loaded
      setIsLoading(false);
      
      // Transfer video element if it's a video
      if (media.type === 'VIDEO') {
        await transferVideoElement('loadMedia');
      } else if (media.type === 'AUDIO' && containerRef.current) {
        // Keep container visible for audio
        // Keep pointer-events: none on container to avoid blocking modal clicks
        // The audio element itself will handle its own pointer events
        containerRef.current.style.display = 'block';
      } else if (containerRef.current) {
        // Hide for ebooks
        containerRef.current.style.display = 'none';
      }
      
      // Clear playlist context when loading single media
      setPlaylist([]);
      setCurrentIndex(-1);
      
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
      setIsLoading(false);
    }
  }, [enablePersistence, preserveStateOnNavigation, state.currentMedia]);

  // Load playlist with starting index
  const loadPlaylist = useCallback(async (media: MediaItem[], startIndex: number = 0) => {
    if (!playerRef.current || media.length === 0) return;
    
    // Validate startIndex
    const validStartIndex = Math.max(0, Math.min(startIndex, media.length - 1));
    
    // Set playlist state
    setPlaylist(media);
    setCurrentIndex(validStartIndex);
    
    // Load the media at the start index
    const mediaToLoad = media[validStartIndex];
    
    // Show modal immediately with loading state
    setViewMode(MediaViewMode.FULL);
    setIsLoading(true);
    
    // Show the global container temporarily for media loading
    if (containerRef.current) {
      containerRef.current.style.display = 'block';
      containerRef.current.style.pointerEvents = 'none'; // Avoid blocking modal clicks
      containerRef.current.style.zIndex = '30'; // Below modal but above other content
    }
    
    // Set media info immediately so modal shows content
    setState(prev => ({
      ...prev,
      currentMedia: mediaToLoad,
      currentTime: 0,
      isPlaying: false,
      error: null
    }));
    
    try {
      // Skip MediaPlayerCore for ebooks - they're handled by EbookViewer component
      if (mediaToLoad.type !== 'EBOOK') {
        await playerRef.current.load(mediaToLoad);
      }
      
      // Clear loading state after media is loaded
      setIsLoading(false);
      
      // Transfer video element to FullPlayerView if it's a video (with retry mechanism)
      if (mediaToLoad.type === 'VIDEO' && containerRef.current) {
        // Wait for video element to be created with retry mechanism
        let videoElement: HTMLVideoElement | null = null;
        let retries = 0;
        const maxRetries = 5;
        
        while (!videoElement && retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 100 * (retries + 1))); // Increasing delay
          videoElement = containerRef.current.querySelector('video');
          retries++;
        }
        
        if (videoElement) {
          // Wait for FullPlayerView to render
          let videoPlaceholder: Element | null = null;
          retries = 0;
          
          while (!videoPlaceholder && retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 50));
            videoPlaceholder = document.querySelector('[data-video-placeholder]');
            retries++;
          }
          
          if (videoPlaceholder) {
            // Clear placeholder content
            videoPlaceholder.innerHTML = '';
            // Move video element to the placeholder
            videoPlaceholder.appendChild(videoElement);
            
            // Ensure video element is properly styled for the container
            videoElement.style.width = '100%';
            videoElement.style.height = '100%';
            videoElement.style.objectFit = 'contain';
            videoElement.style.backgroundColor = 'black';
            videoElement.style.display = 'block';
            videoElement.style.position = 'relative';
            videoElement.style.zIndex = '1';
            
            // Hide the loading text
            const loadingText = videoPlaceholder.querySelector('.text-gray-500');
            if (loadingText) {
              (loadingText as HTMLElement).style.display = 'none';
            }
            
            console.log('[MediaPlayerProvider] Video element transferred to FullPlayerView (playlist)');
            
            // Hide the global container after successful transfer
            containerRef.current.style.display = 'none';
            containerRef.current.style.pointerEvents = 'none';
          } else {
            console.warn('[MediaPlayerProvider] Video placeholder not found after retries (playlist), keeping video in global container');
            // Keep the video visible in the global container if placeholder not found
            containerRef.current.style.display = 'block';
            containerRef.current.style.pointerEvents = 'auto';
            containerRef.current.style.zIndex = '45'; // Above modal overlay but below modal content
            
            // Style the video element for global container display
            videoElement.style.position = 'fixed';
            videoElement.style.top = '50%';
            videoElement.style.left = '50%';
            videoElement.style.transform = 'translate(-50%, -50%)';
            videoElement.style.maxWidth = '90vw';
            videoElement.style.maxHeight = '90vh';
            videoElement.style.width = 'auto';
            videoElement.style.height = 'auto';
            videoElement.style.objectFit = 'contain';
            videoElement.style.backgroundColor = 'black';
            videoElement.style.zIndex = '45';
          }
        } else {
          console.error('[MediaPlayerProvider] Video element not found after retries (playlist)');
          // Keep container visible as fallback
          containerRef.current.style.display = 'block';
          containerRef.current.style.pointerEvents = 'auto';
          containerRef.current.style.zIndex = '45';
        }
      } else if (mediaToLoad.type === 'AUDIO' && containerRef.current) {
        // Keep visible for audio
        // Keep pointer-events: none on container to avoid blocking modal clicks
        containerRef.current.style.display = 'block';
      } else if (containerRef.current) {
        // Hide for ebooks
        containerRef.current.style.display = 'none';
      }
      
      // Store current media ID for navigation persistence
      if (preserveStateOnNavigation) {
        sessionStorage.setItem('media-player-current-media-id', mediaToLoad.id);
        sessionStorage.setItem('media-player-playlist-index', validStartIndex.toString());
      }
      
      // Try to restore previous state for this media
      if (enablePersistence && stateManagerRef.current) {
        const savedState = await stateManagerRef.current.loadState(mediaToLoad.id);
        if (savedState) {
          setState(prev => ({
            ...prev,
            currentTime: savedState.currentTime,
            volume: savedState.volume * 100,
            playbackRate: savedState.playbackRate,
            isPlaying: savedState.isPlaying
          }));
          
          if (playerRef.current) {
            playerRef.current.seek(savedState.currentTime);
            playerRef.current.setVolume(savedState.volume);
            playerRef.current.setPlaybackRate(savedState.playbackRate);
            
            if (savedState.isPlaying) {
              try {
                await playerRef.current.play();
              } catch (playError) {
                console.warn('Could not auto-resume playback:', playError);
                setState(prev => ({ ...prev, isPlaying: false }));
              }
            }
          }
        }
      }
    } catch (error) {
      const mediaError: MediaPlayerError = {
        code: 'LOAD_FAILED' as any,
        message: 'Failed to load playlist media',
        severity: 'high',
        timestamp: new Date(),
        context: { error, mediaId: mediaToLoad.id, playlistIndex: validStartIndex }
      };
      setState(prev => ({ ...prev, error: mediaError }));
      setIsLoading(false);
    }
  }, [enablePersistence, preserveStateOnNavigation]);

  // Smart playlist navigation - only for audio files
  const getAudioPlaylist = useCallback(() => {
    if (!state.currentMedia || state.currentMedia.type !== MediaType.AUDIO) {
      return { audioItems: [], currentAudioIndex: -1, hasNext: false, hasPrevious: false };
    }
    
    // Filter only audio items from the playlist
    const audioItems = playlist.filter(item => item.type === MediaType.AUDIO);
    const currentAudioIndex = audioItems.findIndex(item => item.id === state.currentMedia?.id);
    
    return {
      audioItems,
      currentAudioIndex,
      hasNext: currentAudioIndex >= 0 && currentAudioIndex < audioItems.length - 1,
      hasPrevious: currentAudioIndex > 0
    };
  }, [playlist, state.currentMedia]);

  const audioPlaylistInfo = getAudioPlaylist();
  
  // Computed properties for playlist navigation
  const hasNext = audioPlaylistInfo.hasNext;
  const hasPrevious = audioPlaylistInfo.hasPrevious;

  // Navigate to next audio track in playlist
  const next = useCallback(async () => {
    if (!state.currentMedia || state.currentMedia.type !== MediaType.AUDIO) {
      console.warn('Next/Previous navigation only available for audio files');
      return;
    }
    
    const { audioItems, currentAudioIndex, hasNext: hasNextAudio } = audioPlaylistInfo;
    
    if (!hasNextAudio || audioItems.length === 0) {
      console.warn('No next audio track available');
      return;
    }
    
    const nextAudioMedia = audioItems[currentAudioIndex + 1];
    
    // Find the next audio media in the original playlist to get the correct index
    const nextIndex = playlist.findIndex(item => item.id === nextAudioMedia.id);
    const nextMedia = playlist[nextIndex];
    
    if (!nextMedia) {
      console.error('Next media not found in playlist');
      return;
    }
    
    // Stop current media playback - let MediaPlayerCore handle cleanup properly
    // @ts-ignore
    if (playerRef.current && state.currentMedia?.type !== MediaType.EBOOK) {
      playerRef.current.stop();
      // Don't manually remove video elements - this breaks video recreation
    }
    
    setCurrentIndex(nextIndex);
    
    setIsLoading(true);
    try {
      if (!playerRef.current) return;
      
      // Show the global container temporarily for media loading
      if (containerRef.current) {
        containerRef.current.style.display = 'block';
        containerRef.current.style.pointerEvents = 'none'; // Avoid blocking modal clicks
        containerRef.current.style.zIndex = '30'; // Below modal but above other content
      }
      
      // Skip MediaPlayerCore for ebooks - they're handled by EbookViewer component
      if (nextMedia.type !== 'EBOOK') {
        await playerRef.current.load(nextMedia);
      }
      
      // Update state immediately after loading
      setState(prev => ({
        ...prev,
        currentMedia: nextMedia,
        currentTime: 0,
        isPlaying: false,
        error: null
      }));
      
      // For videos, transfer element BEFORE clearing loading state
      // For audio/ebooks, clear loading state immediately
      if (nextMedia.type !== 'VIDEO') {
        setIsLoading(false);
      }
      
      // Transfer video element if it's a video
      if (nextMedia.type === 'VIDEO') {
        const success = await transferVideoElement('next');
        
        // If transfer failed, ensure video is still visible somewhere
        if (!success && containerRef.current) {
          console.warn('[MediaPlayerProvider] Video transfer failed, showing in global container');
          containerRef.current.style.display = 'block';
          containerRef.current.style.pointerEvents = 'auto';
          containerRef.current.style.zIndex = '45';
        }
        
        setIsLoading(false); // Always clear loading after video transfer attempt
      } else if (nextMedia.type === 'AUDIO' && containerRef.current) {
        // Keep visible for audio
        // Keep pointer-events: none on container to avoid blocking modal clicks
        containerRef.current.style.display = 'block';
      } else if (containerRef.current) {
        // Hide for ebooks
        containerRef.current.style.display = 'none';
      }
      
      // Store updated playlist index
      if (preserveStateOnNavigation) {
        sessionStorage.setItem('media-player-current-media-id', nextMedia.id);
        sessionStorage.setItem('media-player-playlist-index', nextIndex.toString());
      }
      
      // Auto-play the next track (skip for ebooks)
      if (nextMedia.type !== 'EBOOK') {
        try {
          await playerRef.current.play();
          setState(prev => ({ ...prev, isPlaying: true }));
        } catch (playError) {
          console.warn('Could not auto-play next track:', playError);
        }
      }
    } catch (error) {
      const mediaError: MediaPlayerError = {
        code: 'LOAD_FAILED' as any,
        message: 'Failed to load next track',
        severity: 'medium',
        timestamp: new Date(),
        context: { error, mediaId: nextMedia.id, playlistIndex: nextIndex }
      };
      setState(prev => ({ ...prev, error: mediaError }));
      setIsLoading(false);
    }
  }, [state.currentMedia, audioPlaylistInfo, playlist, currentIndex, preserveStateOnNavigation]);

  // Navigate to previous audio track in playlist
  const previous = useCallback(async () => {
    if (!state.currentMedia || state.currentMedia.type !== MediaType.AUDIO) {
      console.warn('Next/Previous navigation only available for audio files');
      return;
    }
    
    const { audioItems, currentAudioIndex, hasPrevious: hasPrevAudio } = audioPlaylistInfo;
    
    if (!hasPrevAudio || audioItems.length === 0) {
      console.warn('No previous audio track available');
      return;
    }
    
    const prevAudioMedia = audioItems[currentAudioIndex - 1];
    
    // Find the previous audio media in the original playlist to get the correct index
    const prevIndex = playlist.findIndex(item => item.id === prevAudioMedia.id);
    const prevMedia = playlist[prevIndex];
    
    if (!prevMedia) {
      console.error('Previous media not found in playlist');
      return;
    }
    
    // Stop current media playback - let MediaPlayerCore handle cleanup properly
    // @ts-ignore
    if (playerRef.current && state.currentMedia?.type !== MediaType.EBOOK) {
      playerRef.current.stop();
      // Don't manually remove video elements - this breaks video recreation
    }
    
    setCurrentIndex(prevIndex);
    
    setIsLoading(true);
    try {
      if (!playerRef.current) return;
      
      // Show the global container temporarily for media loading
      if (containerRef.current) {
        containerRef.current.style.display = 'block';
        containerRef.current.style.pointerEvents = 'none'; // Avoid blocking modal clicks
        containerRef.current.style.zIndex = '30'; // Below modal but above other content
      }
      
      // Skip MediaPlayerCore for ebooks - they're handled by EbookViewer component
      if (prevMedia.type !== 'EBOOK') {
        await playerRef.current.load(prevMedia);
      }
      
      // Update state immediately after loading
      setState(prev => ({
        ...prev,
        currentMedia: prevMedia,
        currentTime: 0,
        isPlaying: false,
        error: null
      }));
      
      // For videos, transfer element BEFORE clearing loading state
      // For audio/ebooks, clear loading state immediately
      if (prevMedia.type !== 'VIDEO') {
        setIsLoading(false);
      }
      
      // Transfer video element if it's a video
      if (prevMedia.type === 'VIDEO') {
        const success = await transferVideoElement('previous');
        
        // If transfer failed, ensure video is still visible somewhere
        if (!success && containerRef.current) {
          console.warn('[MediaPlayerProvider] Video transfer failed, showing in global container');
          containerRef.current.style.display = 'block';
          containerRef.current.style.pointerEvents = 'auto';
          containerRef.current.style.zIndex = '45';
        }
        
        setIsLoading(false); // Always clear loading after video transfer attempt
      } else if (prevMedia.type === 'AUDIO' && containerRef.current) {
        // Keep visible for audio
        // Keep pointer-events: none on container to avoid blocking modal clicks
        containerRef.current.style.display = 'block';
      } else if (containerRef.current) {
        // Hide for ebooks
        containerRef.current.style.display = 'none';
      }
      
      // Store updated playlist index
      if (preserveStateOnNavigation) {
        sessionStorage.setItem('media-player-current-media-id', prevMedia.id);
        sessionStorage.setItem('media-player-playlist-index', prevIndex.toString());
      }
      
      // Auto-play the previous track (skip for ebooks)
      if (prevMedia.type !== 'EBOOK') {
        try {
          await playerRef.current.play();
          setState(prev => ({ ...prev, isPlaying: true }));
        } catch (playError) {
          console.warn('Could not auto-play previous track:', playError);
        }
      }
    } catch (error) {
      const mediaError: MediaPlayerError = {
        code: 'LOAD_FAILED' as any,
        message: 'Failed to load previous track',
        severity: 'medium',
        timestamp: new Date(),
        context: { error, mediaId: prevMedia.id, playlistIndex: prevIndex }
      };
      setState(prev => ({ ...prev, error: mediaError }));
      setIsLoading(false);
    }
  }, [state.currentMedia, audioPlaylistInfo, playlist, currentIndex, preserveStateOnNavigation]);

  // Auto-advance functionality - listen for media ended event
  useEffect(() => {
    if (!containerRef.current) return;
    
    const handleMediaEnded = async () => {
      console.log('[MediaPlayerProvider] Media ended, checking for auto-advance');
      
      // Check if we have a playlist and can advance to next track
      if (playlist.length > 0 && currentIndex >= 0) {
        if (hasNext) {
          // Auto-advance to next track
          console.log('[MediaPlayerProvider] Auto-advancing to next track');
          try {
            await next();
          } catch (error) {
            console.error('[MediaPlayerProvider] Failed to auto-advance:', error);
          }
        } else {
          // End of playlist - stop playback
          console.log('[MediaPlayerProvider] End of playlist reached');
          setState(prev => ({ ...prev, isPlaying: false }));
        }
      } else {
        // Single media item - just stop
        console.log('[MediaPlayerProvider] Single media ended');
        setState(prev => ({ ...prev, isPlaying: false }));
      }
    };
    
    // Add event listener to container for media ended events
    const mediaElements = containerRef.current.querySelectorAll('audio, video');
    mediaElements.forEach(element => {
      element.addEventListener('ended', handleMediaEnded);
    });
    
    // Use MutationObserver to detect when new media elements are added
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLMediaElement) {
            node.addEventListener('ended', handleMediaEnded);
          }
        });
      });
    });
    
    observer.observe(containerRef.current, {
      childList: true,
      subtree: true
    });
    
    // Cleanup function
    return () => {
      if (containerRef.current) {
        const elements = containerRef.current.querySelectorAll('audio, video');
        elements.forEach(element => {
          element.removeEventListener('ended', handleMediaEnded);
        });
      }
      observer.disconnect();
    };
  }, [playlist, currentIndex, hasNext, next]);

  // State synchronization - poll MediaPlayerCore state for real-time updates
  // Using requestAnimationFrame for smoother updates and better performance
  useEffect(() => {
    if (!playerRef.current || !state.currentMedia || isNavigating) return;

    let animationFrameId: number;
    let lastUpdateTime = 0;
    const updateInterval = 100; // Update every 100ms
    
    const syncState = (timestamp: number) => {
      // Throttle updates to ~100ms intervals for performance
      if (timestamp - lastUpdateTime >= updateInterval) {
        if (playerRef.current && !isNavigating) {
          const coreState = playerRef.current.getState();
          
          setState(prev => {
            // Only update if values actually changed to avoid unnecessary re-renders
            const needsUpdate = 
              prev.currentTime !== coreState.currentTime ||
              prev.duration !== coreState.duration ||
              prev.isPlaying !== coreState.isPlaying;
            
            if (needsUpdate) {
              return {
                ...prev,
                currentTime: coreState.currentTime,
                duration: coreState.duration,
                isPlaying: coreState.isPlaying
              };
            }
            
            return prev;
          });
        }
        
        lastUpdateTime = timestamp;
      }
      
      // Continue the animation loop
      animationFrameId = requestAnimationFrame(syncState);
    };
    
    // Start the animation loop
    animationFrameId = requestAnimationFrame(syncState);
    
    // Cleanup on unmount or when dependencies change
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [state.currentMedia, isNavigating]);

  // Playback controls
  const play = useCallback(async () => {
    if (!playerRef.current) return;
    
    // Ebooks don't have playback - they're always "playing" (visible)
    if (state.currentMedia?.type === 'EBOOK') {
      setState(prev => ({ ...prev, isPlaying: true, error: null }));
      return;
    }
    
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
  }, [state.currentMedia]);

  const pause = useCallback(() => {
    if (!playerRef.current) return;
    
    // Ebooks don't have pause - skip
    if (state.currentMedia?.type === 'EBOOK') {
      setState(prev => ({ ...prev, isPlaying: false }));
      return;
    }
    
    playerRef.current.pause();
    setState(prev => ({ ...prev, isPlaying: false }));
  }, [state.currentMedia]);

  const stop = useCallback(() => {
    if (!playerRef.current) return;
    
    // Ebooks don't have stop - just update state
    if (state.currentMedia?.type === 'EBOOK') {
      setState(prev => ({
        ...prev,
        isPlaying: false,
        currentTime: 0,
        currentMedia: null
      }));
      setViewMode(MediaViewMode.HIDDEN);
      return;
    }
    
    playerRef.current.stop();
    setState(prev => ({
      ...prev,
      isPlaying: false,
      currentTime: 0,
      currentMedia: null
    }));
    setViewMode(MediaViewMode.HIDDEN);
  }, [state.currentMedia]);

  const seek = useCallback((position: number) => {
    if (!playerRef.current) return;
    
    // Ebooks don't have seek - skip
    if (state.currentMedia?.type === 'EBOOK') {
      return;
    }
    
    playerRef.current.seek(position);
    setState(prev => ({ ...prev, currentTime: position }));
  }, [state.currentMedia]);

  const setVolume = useCallback((volume: number) => {
    if (!playerRef.current) return;
    
    // Ebooks don't have volume - skip
    if (state.currentMedia?.type === 'EBOOK') {
      return;
    }
    
    const clampedVolume = Math.max(0, Math.min(100, volume));
    playerRef.current.setVolume(clampedVolume / 100);
    setState(prev => ({ ...prev, volume: clampedVolume }));
  }, [state.currentMedia]);

  const setPlaybackRate = useCallback((rate: number) => {
    if (!playerRef.current) return;
    
    // Ebooks don't have playback rate - skip
    if (state.currentMedia?.type === 'EBOOK') {
      return;
    }
    
    playerRef.current.setPlaybackRate(rate);
    setState(prev => ({ ...prev, playbackRate: rate }));
  }, [state.currentMedia]);

  // Close function - defined before minimize since minimize calls it
  const close = useCallback(async () => {
    if (!playerRef.current) return;
    
    console.log('[MediaPlayerProvider] Closing media player');
    
    // Cleanup blob URLs if current media uses one
    if (state.currentMedia?.url && state.currentMedia.url.startsWith('blob:')) {
      try {
        const { cleanupBlobUrl } = await import('@/app/_lib/offline-media-utils');
        cleanupBlobUrl(state.currentMedia.url);
      } catch (error) {
        console.error('[MediaPlayerProvider] Failed to cleanup blob URL:', error);
      }
    }
    
    // Cleanup blob URLs from playlist items
    if (playlist.length > 0) {
      try {
        const { cleanupBlobUrls } = await import('@/app/_lib/offline-media-utils');
        const blobUrls = playlist
          .map(item => item.url)
          .filter(url => url.startsWith('blob:'));
        if (blobUrls.length > 0) {
          cleanupBlobUrls(blobUrls);
        }
      } catch (error) {
        console.error('[MediaPlayerProvider] Failed to cleanup playlist blob URLs:', error);
      }
    }
    
    // Close the player (stops playback and cleans up current handler)
    playerRef.current.close();
    
    // Hide the global container
    if (containerRef.current) {
      containerRef.current.style.display = 'none';
      
      // Remove all media elements from the global container
      const mediaElements = containerRef.current.querySelectorAll('audio, video');
      mediaElements.forEach(element => {
        element.remove();
      });
      
      console.log('[MediaPlayerProvider] Global container hidden and cleaned up');
    }
    
    // Cleanup media ended listener
    if (containerRef.current) {
      const observer = (containerRef.current as any)._endedObserver;
      const handler = (containerRef.current as any)._endedHandler;
      
      if (observer) {
        observer.disconnect();
        delete (containerRef.current as any)._endedObserver;
      }
      
      if (handler) {
        const mediaElements = containerRef.current.querySelectorAll('audio, video');
        mediaElements.forEach(element => {
          element.removeEventListener('ended', handler);
        });
        delete (containerRef.current as any)._endedHandler;
      }
    }
    
    // Clear navigation persistence data
    sessionStorage.removeItem('media-player-current-media-id');
    sessionStorage.removeItem('media-player-continue-playback');
    sessionStorage.removeItem('media-player-navigation-time');
    sessionStorage.removeItem('media-player-navigation-source');
    sessionStorage.removeItem('media-player-playlist-index');
    
    // Clear saved state if we have current media
    if (state.currentMedia && stateManagerRef.current) {
      await stateManagerRef.current.clearState(state.currentMedia.id);
    }
    
    // Reset state including playlist
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
    setPlaylist([]);
    setCurrentIndex(-1);
    setViewMode(MediaViewMode.HIDDEN);
    
    console.log('[MediaPlayerProvider] Media player closed');
  }, [state.currentMedia, playlist]);

  // View mode controls
  const minimize = useCallback(async () => {
    if (!playerRef.current) return;
    
    // For video, close the player instead of minimizing
    if (state.currentMedia?.type === 'VIDEO') {
      await close();
      return;
    }
    
    // For audio, use mini player
    playerRef.current.minimize();
    setViewMode(MediaViewMode.MINI);
    setState(prev => ({ 
      ...prev, 
      isMinimized: true, 
      isPictureInPicture: false 
    }));
    
    // Hide the global container when minimized (hides video/audio elements)
    if (containerRef.current) {
      containerRef.current.style.display = 'none';
    }
  }, [state.currentMedia, close]);

  const maximize = useCallback(async () => {
    if (!playerRef.current) return;
    
    // Transition from picture-in-picture to full mode for video
    if (state.isPictureInPicture && state.currentMedia?.type === 'VIDEO') {
      try {
        // Get the video element from PictureInPictureView
        const videoElement = document.querySelector('[data-media-element]') as HTMLVideoElement;
        
        if (!videoElement) {
          console.error('Video element not found during maximize transition');
          return;
        }
        
        // Store current playback state
        const playbackState = {
          currentTime: videoElement.currentTime,
          paused: videoElement.paused,
          volume: videoElement.volume,
          playbackRate: videoElement.playbackRate
        };
        
        console.log('[MediaPlayerProvider] Transitioning to FULL mode:', playbackState);
        
        // Update view mode to FULL
        setViewMode(MediaViewMode.FULL);
        setState(prev => ({ 
          ...prev, 
          isMinimized: false, 
          isPictureInPicture: false 
        }));
        
        // Hide the global container for video in FULL mode
        if (containerRef.current) {
          containerRef.current.style.display = 'none';
        }
        
        // Wait for FullPlayerView to render, then transfer video element
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Find the FullPlayerView container and transfer the video element
        const fullPlayerContainer = document.querySelector('[data-testid="full-player-view"]');
        if (fullPlayerContainer) {
          const fullVideoPlaceholder = fullPlayerContainer.querySelector('[data-media-element]');
          if (fullVideoPlaceholder && fullVideoPlaceholder.parentNode) {
            // Replace the placeholder with the actual video element
            fullVideoPlaceholder.parentNode.replaceChild(videoElement, fullVideoPlaceholder);
            
            // Restore playback state
            videoElement.currentTime = playbackState.currentTime;
            videoElement.volume = playbackState.volume;
            videoElement.playbackRate = playbackState.playbackRate;
            
            if (!playbackState.paused) {
              await videoElement.play();
            }
            
            console.log('[MediaPlayerProvider] Video element transferred to FULL mode');
          }
        }
        
        return;
      } catch (error) {
        console.error('Failed to transition from picture-in-picture:', error);
      }
    }
    
    // For audio or non-PiP transitions
    playerRef.current.maximize();
    setViewMode(MediaViewMode.FULL);
    setState(prev => ({ 
      ...prev, 
      isMinimized: false, 
      isPictureInPicture: false 
    }));
    
    // Show the global container when maximized for audio (not for video in FULL mode)
    // Keep pointer-events: none on container to avoid blocking modal clicks
    if (containerRef.current && state.currentMedia?.type === 'AUDIO') {
      containerRef.current.style.display = 'block';
    } else if (containerRef.current) {
      // Hide for video in FULL mode
      containerRef.current.style.display = 'none';
    }
  }, [state.isPictureInPicture, state.currentMedia]);

  const pictureInPicture = useCallback(async () => {
    if (!playerRef.current || !state.currentMedia) return;
    
    try {
      // Enforce video-only restriction
      if (state.currentMedia.type !== 'VIDEO') {
        throw new Error('Picture-in-picture only available for video content');
      }
      
      // Get the video element
      const videoElement = document.querySelector('[data-media-element]') as HTMLVideoElement;
      
      if (!videoElement) {
        console.error('Video element not found for picture-in-picture transition');
        return;
      }
      
      // Store current playback state
      const playbackState = {
        currentTime: videoElement.currentTime,
        paused: videoElement.paused,
        volume: videoElement.volume,
        playbackRate: videoElement.playbackRate
      };
      
      console.log('[MediaPlayerProvider] Transitioning to PiP mode via pictureInPicture function:', playbackState);
      
      // Update viewMode state to PICTURE_IN_PICTURE
      setViewMode(MediaViewMode.PICTURE_IN_PICTURE);
      setState(prev => ({ 
        ...prev, 
        isPictureInPicture: true, 
        isMinimized: false 
      }));
      
      // Show the global container for PiP mode
      // Keep pointer-events: none on container to avoid blocking clicks
      if (containerRef.current) {
        containerRef.current.style.display = 'block';
      }
      
      // Wait for PictureInPictureView to render, then transfer video element
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Find the PiP container and transfer the video element
      const pipContainer = document.querySelector('[data-testid="picture-in-picture-view"]');
      if (pipContainer) {
        const pipVideoPlaceholder = pipContainer.querySelector('[data-media-element]');
        if (pipVideoPlaceholder && pipVideoPlaceholder.parentNode) {
          // Replace the placeholder with the actual video element
          pipVideoPlaceholder.parentNode.replaceChild(videoElement, pipVideoPlaceholder);
          
          // Restore playback state
          videoElement.currentTime = playbackState.currentTime;
          videoElement.volume = playbackState.volume;
          videoElement.playbackRate = playbackState.playbackRate;
          
          if (!playbackState.paused) {
            await videoElement.play();
          }
          
          console.log('[MediaPlayerProvider] Video element transferred to PiP via pictureInPicture function');
        }
      }
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

  // Cleanup on unmount with navigation persistence consideration
  useEffect(() => {
    return () => {
      const performCleanup = async () => {
        console.log('[MediaPlayerProvider] Component unmounting, performing cleanup');
        
        // Only cleanup if we're not preserving state for navigation
        if (!preserveStateOnNavigation) {
          // Cleanup all blob URLs
          try {
            const { cleanupAllBlobUrls } = await import('@/app/_lib/offline-media-utils');
            const cleanedCount = cleanupAllBlobUrls();
            console.log(`[MediaPlayerProvider] Cleaned up ${cleanedCount} blob URLs on unmount`);
          } catch (error) {
            console.error('[MediaPlayerProvider] Failed to cleanup blob URLs on unmount:', error);
          }
          
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
          
          if (containerRef.current) {
            // Cleanup media ended listener
            const observer = (containerRef.current as any)._endedObserver;
            const handler = (containerRef.current as any)._endedHandler;
            
            if (observer) {
              observer.disconnect();
            }
            
            if (handler) {
              const mediaElements = containerRef.current.querySelectorAll('audio, video');
              mediaElements.forEach(element => {
                element.removeEventListener('ended', handler);
              });
            }
            
            if (containerRef.current.parentNode) {
              containerRef.current.parentNode.removeChild(containerRef.current);
            }
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
    
    // Playlist State
    playlist,
    currentIndex,
    hasNext,
    hasPrevious,
    
    // Actions
    loadMedia,
    loadPlaylist,
    play,
    pause,
    stop,
    seek,
    setVolume,
    setPlaybackRate,
    next,
    previous,
    
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