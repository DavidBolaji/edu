/**
 * Media Player Module
 * Exports all media player components following Single Responsibility Principle
 */

export { MediaPlayerCore } from './media-player-core';
export { AudioController } from './audio-controller';
export { VideoController } from './video-controller';
export { EbookController } from './ebook-controller';
export { PlaybackStateManager } from './playback-state-manager';
export { PlaybackPersistence } from './playback-persistence';
export { StateSynchronization } from './state-synchronization';
export { MediaUIController } from './media-ui-controller';
export { 
  ResourceManager, 
  MediaElementPool, 
  EventListenerManager 
} from './resource-manager';

// Re-export types
export type {
  IMediaPlayer,
  IMediaState,
  IMediaHandler,
  IPlaybackStateManager,
  IPlaybackPersistence,
  IStateSynchronization,
  IMediaUIController,
  MediaPlayerConfig,
  MediaPlayerError,
  MediaViewMode
} from '@/src/entities/models/media-player';

export type {
  IResourceManager,
  ManagedResource,
  ResourceStats
} from './resource-manager';

export { MediaErrorCode } from '@/src/entities/models/media-player';
