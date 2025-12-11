'use client';

import React, { useEffect, useCallback } from 'react';
import { useMediaPlayer } from '@/app/_contexts/media-player-provider';
import { MediaViewMode } from '@/src/entities/models/media-player';
import { Dialog, DialogContent, DialogOverlay, DialogPortal } from '@/app/_components/ui/dialog';
import { FullPlayerView } from './full-player-view';
import { MiniPlayerView } from './mini-player-view';
import { Button } from '@/app/_components/ui/button';
import { SkipBack, SkipForward, List, X } from 'lucide-react';
import { cn } from '@/app/_lib/utils';

/**
 * MediaPlayerModal - Unified modal component for media playback
 * 
 * This component wraps the media player views and handles modal-specific UI concerns.
 * It uses the global MediaPlayerProvider for state management and supports:
 * - Full player view for immersive playback
 * - Mini player view for persistent playback while navigating
 * - Picture-in-picture view for video content
 * - Playlist navigation
 * - Proper cleanup on close
 */
export function MediaPlayerModal() {
    const {
        state,
        viewMode,
        isLoading,
        playlist,
        currentIndex,
        hasNext,
        hasPrevious,
        play,
        pause,
        seek,
        setVolume,
        next,
        previous,
        minimize,
        maximize,
        close
    } = useMediaPlayer();

    // Determine if modal should be open based on view mode
    const isModalOpen = viewMode === MediaViewMode.FULL;
    const isMiniPlayerVisible = viewMode === MediaViewMode.MINI;

    // Handle modal close with proper cleanup
    // This calls the MediaPlayerProvider's close() method which:
    // - Stops playback and cleans up media resources via MediaPlayerCore
    // - Revokes blob URLs if used (for offline media)
    // - Clears session storage for navigation persistence
    // - Resets all state including playlist
    const handleClose = useCallback(() => {
        close();
    }, [close]);

    // Handle volume toggle for mini player and PiP
    const handleVolumeToggle = useCallback(() => {
        if (state.volume === 0) {
            setVolume(75); // Restore to default volume
        } else {
            setVolume(0); // Mute
        }
    }, [state.volume, setVolume]);

    // Cleanup on component unmount
    useEffect(() => {
        return () => {
            // Component is unmounting - ensure proper cleanup
            // The MediaPlayerProvider will handle the actual cleanup
            // This is just to ensure we don't leave any dangling references
            console.log('[MediaPlayerModal] Component unmounting');
        };
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        if (!state.currentMedia) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Only handle shortcuts when modal is open or mini player is visible
            if (viewMode === MediaViewMode.HIDDEN) return;

            switch (e.key) {
                case ' ':
                    // Space bar - play/pause
                    e.preventDefault();
                    if (state.isPlaying) {
                        pause();
                    } else {
                        play();
                    }
                    break;
                case 'ArrowLeft':
                    // Left arrow - seek backward 10 seconds
                    e.preventDefault();
                    seek(Math.max(0, state.currentTime - 10));
                    break;
                case 'ArrowRight':
                    // Right arrow - seek forward 10 seconds
                    e.preventDefault();
                    seek(Math.min(state.duration, state.currentTime + 10));
                    break;
                case 'ArrowUp':
                    // Up arrow - increase volume
                    e.preventDefault();
                    setVolume(Math.min(100, state.volume + 10));
                    break;
                case 'ArrowDown':
                    // Down arrow - decrease volume
                    e.preventDefault();
                    setVolume(Math.max(0, state.volume - 10));
                    break;
                case 'm':
                case 'M':
                    // M - toggle mute
                    e.preventDefault();
                    handleVolumeToggle();
                    break;
                case 'f':
                case 'F':
                    // F - toggle fullscreen (maximize/minimize)
                    e.preventDefault();
                    if (viewMode === MediaViewMode.FULL) {
                        minimize();
                    } else {
                        maximize();
                    }
                    break;
                case 'Escape':
                    // Escape - minimize or close
                    e.preventDefault();
                    if (viewMode === MediaViewMode.FULL) {
                        minimize();
                    } else {
                        handleClose();
                    }
                    break;
                case 'n':
                case 'N':
                    // N - next audio track (only for audio files)
                    if (hasNext && state.currentMedia?.type === 'AUDIO') {
                        e.preventDefault();
                        next();
                    }
                    break;
                case 'p':
                case 'P':
                    // P - previous audio track (only for audio files)
                    if (hasPrevious && state.currentMedia?.type === 'AUDIO') {
                        e.preventDefault();
                        previous();
                    }
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        state.currentMedia,
        state.isPlaying,
        state.currentTime,
        state.duration,
        state.volume,
        viewMode,
        hasNext,
        hasPrevious,
        play,
        pause,
        seek,
        setVolume,
        minimize,
        maximize,
        handleClose,
        handleVolumeToggle,
        next,
        previous
    ]);

    return (
        <>
            {/* Full Player Modal */}
            <Dialog open={isModalOpen} onOpenChange={(open) => !open && minimize()}>
                <DialogPortal>
                    <DialogOverlay className="bg-black/95" />
                    <DialogContent
                        className={cn(
                            "max-w-7xl w-[95vw] h-[90vh] p-0 border-0 bg-transparent",
                            "overflow-hidden"
                        )}
                        // Prevent default close button from showing
                        onPointerDownOutside={(e) => e.preventDefault()}
                        onEscapeKeyDown={(e) => {
                            e.preventDefault();
                            minimize();
                        }}
                    >
                        {/* Decorative Header - Gradient Bar */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 z-10" />

                        {/* Loading Overlay */}
                        {isLoading && (
                            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
                                <div className="flex flex-col items-center space-y-4">
                                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white"></div>
                                    <p className="text-white text-lg font-medium">Loading media...</p>
                                </div>
                            </div>
                        )}

                        {/* Error Display */}
                        {state.error ? (
                            state.currentMedia?.type === "EBOOK" && state.error.code === "PLAYBACK_FAILED" ? null :
                                <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-20 p-6">
                                    <div className="text-center max-w-2xl">
                                        <div className="text-red-500 text-6xl mb-4">⚠️</div>
                                        <h3 className="text-white text-2xl font-bold mb-2">Playback Error</h3>
                                        <p className="text-gray-300 text-lg mb-4">{state.error.message}</p>
                                        <p className="text-gray-400 text-sm mb-6">
                                            Error Code: {state.error.code}
                                        </p>

                                        {/* Display suggestions if available (CORS, CSP errors) */}
                                        {state.error.context?.suggestions && Array.isArray(state.error.context.suggestions) && (
                                            <div className="text-left bg-gray-800/50 rounded-lg p-4 mb-6 max-w-xl mx-auto">
                                                <p className="text-sm font-medium text-gray-300 mb-2">
                                                    Troubleshooting suggestions:
                                                </p>
                                                <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
                                                    {state.error.context.suggestions.map((suggestion: string, index: number) => (
                                                        <li key={index}>{suggestion}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        <div className="flex space-x-4 justify-center">
                                            <button
                                                onClick={() => {
                                                    // Retry by reloading the current media
                                                    if (state.currentMedia) {
                                                        play();
                                                    }
                                                }}
                                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                                            >
                                                Retry
                                            </button>
                                            <button
                                                onClick={handleClose}
                                                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </div>
                                </div>
                        ) : null}

                        {/* Player View */}
                        <FullPlayerView
                            state={state}
                            onPlay={play}
                            onPause={pause}
                            onSeek={seek}
                            onVolumeChange={setVolume}
                            onMinimize={minimize}
                            onClose={handleClose}
                            className="w-full h-full"
                        />

                        {/* Close Button Overlay for Ebook - blocks Google Docs "open in new tab" */}
                        {state.currentMedia?.type === 'EBOOK' && (
                            <div className="absolute top-4 right-4 z-60">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleClose}
                                    className="bg-black/60 hover:bg-black/80 text-white rounded-full h-10 w-10"
                                    title="Close (Esc)"
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        )}

                        {/* Playlist Controls Overlay - Only for Audio */}
                        {state.currentMedia?.type === 'AUDIO' && playlist.length > 0 && (() => {
                            // Calculate audio-only playlist info for display
                            const audioItems = playlist.filter(item => item.type === 'AUDIO');
                            const currentAudioIndex = audioItems.findIndex(item => item.id === state.currentMedia?.id);
                            
                            return audioItems.length > 1 && currentAudioIndex >= 0 ? (
                                <div className="absolute bottom-4 left-1/2 md:left-3/4 transform -translate-x-1/2 z-[999]">
                                    <div className="bg-black/80 backdrop-blur-sm rounded-full px-3 md:px-6 py-2 md:py-3 flex items-center space-x-2 md:space-x-4 border border-white/20">
                                        {/* Audio Playlist Indicator */}
                                        <div className="flex items-center space-x-2 text-white">
                                            <List className="h-4 w-4" />
                                            <span className="text-xs md:text-sm font-medium">
                                                {currentAudioIndex + 1} of {audioItems.length} audio
                                            </span>
                                        </div>

                                        {/* Previous Button */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={previous}
                                            disabled={!hasPrevious}
                                            className={cn(
                                                "text-white hover:bg-white/20 h-10 w-10 md:h-8 md:w-8",
                                                !hasPrevious && "opacity-50 cursor-not-allowed"
                                            )}
                                            title="Previous audio track (P)"
                                        >
                                            <SkipBack className="h-5 w-5" />
                                        </Button>

                                        {/* Next Button */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={next}
                                            disabled={!hasNext}
                                            className={cn(
                                                "text-white hover:bg-white/20 h-10 w-10 md:h-8 md:w-8",
                                                !hasNext && "opacity-50 cursor-not-allowed"
                                            )}
                                            title="Next audio track (N)"
                                        >
                                            <SkipForward className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>
                            ) : null;
                        })()}
                    </DialogContent>
                </DialogPortal>
            </Dialog>

            {/* Mini Player - Rendered outside modal */}
            {isMiniPlayerVisible && state.currentMedia && (
                <MiniPlayerView
                    state={state}
                    onPlay={play}
                    onPause={pause}
                    onVolumeToggle={handleVolumeToggle}
                    onMaximize={maximize}
                    onClose={handleClose}
                />
            )}
        </>
    );
}
