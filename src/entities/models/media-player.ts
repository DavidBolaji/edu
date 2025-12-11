/**
 * Media Player Core Interfaces
 * Following SOLID principles with focused, single-responsibility interfaces
 */

import { MediaItem, MediaType, PlaybackState } from './media';

// Core Media Player Interface
export interface IMediaPlayer {
  load(media: MediaItem): Promise<void>;
  play(): Promise<void>;
  pause(): void;
  stop(): void;
  seek(position: number): void;
  setVolume(volume: number): void;
  setPlaybackRate(rate: number): void;
  minimize(): void;
  maximize(): void;
  togglePictureInPicture(): Promise<void>;
  close(): void;
  cleanup(): Promise<void>;
  getState(): IMediaState;
}

// Media State Interface
export interface IMediaState {
  currentMedia: MediaItem | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  isMinimized: boolean;
  isPictureInPicture: boolean;
  error: MediaPlayerError | null;
}

// Media Handler Interface (Strategy Pattern)
export interface IMediaHandler {
  canHandle(mediaType: MediaType): boolean;
  initialize(container: HTMLElement): Promise<void>;
  load(media: MediaItem): Promise<void>;
  play(): Promise<void>;
  pause(): void;
  stop(): void;
  seek(position: number): void;
  setVolume(volume: number): void;
  setPlaybackRate(rate: number): void;
  getCurrentTime(): number;
  getDuration(): number;
  cleanup(): void;
  onTimeUpdate(callback: (time: number) => void): void;
  onEnded(callback: () => void): void;
  onError(callback: (error: MediaPlayerError) => void): void;
  /**
   * Register callback for duration changes
   * Called when media metadata loads or duration changes
   * @param callback Function to call with the new duration value
   */
  onDurationChange?(callback: (duration: number) => void): void;
}

// Playback Persistence Interface (for IndexedDB storage)
export interface IPlaybackPersistence {
  saveState(state: PlaybackState): Promise<void>;
  loadState(mediaId: string): Promise<PlaybackState | null>;
  clearState(mediaId: string): Promise<void>;
  getAllStates(): Promise<PlaybackState[]>;
  exportStates(): Promise<PlaybackState[]>;
  importStates(states: PlaybackState[]): Promise<void>;
  cleanupOldStates(daysOld?: number): Promise<void>;
  close(): Promise<void>;
}

// State Synchronization Interface (for cross-tab consistency)
export interface IStateSynchronization {
  broadcastStateChange(state: PlaybackState): void;
  onStateChange(callback: (state: PlaybackState) => void): void;
  removeStateChangeListener(callback: (state: PlaybackState) => void): void;
  syncWithOtherTabs(): Promise<void>;
  cleanup(): void;
}

// Playback State Manager Interface (orchestrates persistence and sync)
export interface IPlaybackStateManager {
  saveState(state: PlaybackState): Promise<void>;
  loadState(mediaId: string): Promise<PlaybackState | null>;
  clearState(mediaId: string): Promise<void>;
  getAllStates(): Promise<PlaybackState[]>;
  startAutoSave(getState: () => PlaybackState, intervalMs?: number): void;
  stopAutoSave(): void;
  enableCrossTabSync(enabled: boolean): void;
  onStateRestored(callback: (state: PlaybackState) => void): void;
}

// Media UI Controller Interface
export interface IMediaUIController {
  setMinimized(minimized: boolean): void;
  setPictureInPicture(enabled: boolean): Promise<void>;
  showControls(show: boolean): void;
  updateProgress(current: number, duration: number): void;
  setLoading(loading: boolean): void;
  setError(error: MediaPlayerError | null): void;
  getViewMode(): MediaViewMode;
}

// Media Player Error
export interface MediaPlayerError {
  code: MediaErrorCode;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
  timestamp: Date;
}

export enum MediaErrorCode {
  LOAD_FAILED = 'LOAD_FAILED',
  PLAYBACK_FAILED = 'PLAYBACK_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  STORAGE_ERROR = 'STORAGE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export enum MediaViewMode {
  FULL = 'full',
  MINI = 'mini',
  PICTURE_IN_PICTURE = 'pip',
  HIDDEN = 'hidden'
}

// Media Player Configuration
export interface MediaPlayerConfig {
  autoSaveInterval?: number; // milliseconds, default 5000
  enablePictureInPicture?: boolean;
  enableMiniPlayer?: boolean;
  defaultVolume?: number;
  defaultPlaybackRate?: number;
}
