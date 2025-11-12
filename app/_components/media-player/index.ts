/**
 * Media Player UI Components
 * Unified media player system with multiple view modes
 */

export { FullPlayerView } from './full-player-view';
export { MiniPlayerView } from './mini-player-view';
export { PictureInPictureView } from './picture-in-picture-view';
export { UnifiedMediaPlayer, type MediaPlayerControls } from './unified-media-player';

// Re-export types for convenience
export type {
  IMediaState,
  MediaViewMode,
  IMediaPlayer,
  MediaPlayerError
} from '@/src/entities/models/media-player';

export { MediaErrorCode } from '@/src/entities/models/media-player';