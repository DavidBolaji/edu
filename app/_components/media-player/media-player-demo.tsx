'use client';

import React, { useState } from 'react';
import { Button } from '@/app/_components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { UnifiedMediaPlayer } from './unified-media-player';
import { useMediaPlayer } from '@/app/_hooks/use-media-player';
import { MediaItem, MediaType } from '@/src/entities/models/media';
import { MediaViewMode } from '@/src/entities/models/media-player';

// Sample media items for demonstration
const sampleMedia: MediaItem[] = [
  {
    id: '1',
    name: 'Introduction to React',
    type: MediaType.VIDEO,
    url: '/sample-video.mp4',
    duration: 1800, // 30 minutes
    size: 52428800, // 50MB
    format: 'mp4',
    courseId: 'course-1',
    levelId: 'level-1',
    userId: 'demo-user',
    createdAt: new Date(),
    updatedAt: new Date(),
    metadata: {
      title: 'Introduction to React',
      description: 'Learn the basics of React development',
      thumbnail: '/sample-thumbnail.jpg',
      chapters: [
        { id: '1', title: 'Getting Started', startTime: 0, endTime: 600 },
        { id: '2', title: 'Components', startTime: 600, endTime: 1200 },
        { id: '3', title: 'State Management', startTime: 1200, endTime: 1800 }
      ]
    }
  },
  {
    id: '2',
    name: 'JavaScript Fundamentals',
    type: MediaType.AUDIO,
    url: '/sample-audio.mp3',
    duration: 2400, // 40 minutes
    size: 38400000, // 36MB
    format: 'mp3',
    courseId: 'course-1',
    levelId: 'level-2',
    userId: 'demo-user',
    createdAt: new Date(),
    updatedAt: new Date(),
    metadata: {
      title: 'JavaScript Fundamentals',
      description: 'Master the core concepts of JavaScript programming'
    }
  },
  {
    id: '3',
    name: 'Web Development Guide',
    type: MediaType.EBOOK,
    url: '/sample-ebook.pdf',
    size: 5242880, // 5MB
    format: 'pdf',
    courseId: 'course-2',
    levelId: 'level-1',
    userId: 'demo-user',
    createdAt: new Date(),
    updatedAt: new Date(),
    metadata: {
      title: 'Complete Web Development Guide',
      description: 'A comprehensive guide to modern web development practices'
    }
  }
];

export function MediaPlayerDemo() {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  
  const {
    state,
    viewMode,
    isLoading,
    loadMedia,
    play,
    pause,
    stop,
    seek,
    setVolume,
    minimize,
    maximize,
    pictureInPicture,
    close
  } = useMediaPlayer({
    enablePersistence: true,
    enableCrossTabSync: true,
    onError: (error) => {
      console.error('Media Player Error:', error);
    },
    onStateChange: (newState) => {
      console.log('Media Player State Changed:', newState);
    }
  });

  const handleLoadMedia = async (media: MediaItem) => {
    setSelectedMedia(media);
    await loadMedia(media);
  };

  const getViewModeLabel = (mode: MediaViewMode): string => {
    switch (mode) {
      case MediaViewMode.FULL:
        return 'Full Screen';
      case MediaViewMode.MINI:
        return 'Mini Player';
      case MediaViewMode.PICTURE_IN_PICTURE:
        return 'Picture-in-Picture';
      case MediaViewMode.HIDDEN:
        return 'Hidden';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Media Player Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Media Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Select Media</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sampleMedia.map((media) => (
                <Card 
                  key={media.id} 
                  className={`cursor-pointer transition-colors ${
                    selectedMedia?.id === media.id 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => handleLoadMedia(media)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">
                        {media.type === MediaType.VIDEO && '🎥'}
                        {media.type === MediaType.AUDIO && '🎵'}
                        {media.type === MediaType.EBOOK && '📖'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{media.name}</h4>
                        <p className="text-sm text-gray-500 capitalize">
                          {media.type} • {media.format?.toUpperCase()}
                        </p>
                        {media.duration && (
                          <p className="text-xs text-gray-400">
                            {Math.floor(media.duration / 60)}:{(media.duration % 60).toString().padStart(2, '0')}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Player Controls */}
          {state.currentMedia && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Player Controls</h3>
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={state.isPlaying ? pause : play}
                  disabled={isLoading}
                >
                  {state.isPlaying ? 'Pause' : 'Play'}
                </Button>
                <Button onClick={stop} variant="outline">
                  Stop
                </Button>
                <Button onClick={minimize} variant="outline">
                  Minimize
                </Button>
                <Button onClick={maximize} variant="outline">
                  Maximize
                </Button>
                {state.currentMedia.type === MediaType.VIDEO && (
                  <Button onClick={pictureInPicture} variant="outline">
                    Picture-in-Picture
                  </Button>
                )}
                <Button onClick={close} variant="destructive">
                  Close
                </Button>
              </div>
            </div>
          )}

          {/* Player State */}
          {state.currentMedia && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Player State</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Status:</span>
                  <p className={state.isPlaying ? 'text-green-600' : 'text-gray-600'}>
                    {state.isPlaying ? 'Playing' : 'Paused'}
                  </p>
                </div>
                <div>
                  <span className="font-medium">View Mode:</span>
                  <p>{getViewModeLabel(viewMode)}</p>
                </div>
                <div>
                  <span className="font-medium">Volume:</span>
                  <p>{state.volume}%</p>
                </div>
                <div>
                  <span className="font-medium">Progress:</span>
                  <p>
                    {Math.floor(state.currentTime / 60)}:{(Math.floor(state.currentTime) % 60).toString().padStart(2, '0')} / {' '}
                    {Math.floor(state.duration / 60)}:{(Math.floor(state.duration) % 60).toString().padStart(2, '0')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {state.error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
                Error: {state.error.code}
              </h4>
              <p className="text-red-600 dark:text-red-300 text-sm">
                {state.error.message}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unified Media Player */}
      <UnifiedMediaPlayer
        initialMedia={selectedMedia || undefined}
        initialViewMode={viewMode}
        onStateChange={(newState) => {
          console.log('Player state updated:', newState);
        }}
        onViewModeChange={(mode) => {
          console.log('View mode changed:', mode);
        }}
        onClose={() => {
          setSelectedMedia(null);
          console.log('Player closed');
        }}
      />
    </div>
  );
}