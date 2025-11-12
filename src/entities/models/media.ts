export interface MediaItem {
  id: string
  name: string
  type: MediaType
  url: string
  duration?: number
  size: number
  format: string
  courseId: string
  levelId: string
  userId: string
  metadata?: MediaMetadata
  createdAt: Date
  updatedAt: Date
}

export interface MediaMetadata {
  title?: string
  description?: string
  thumbnail?: string
  chapters?: Chapter[]
  subtitles?: Subtitle[]
  quality?: VideoQuality[]
}

export interface Chapter {
  id: string
  title: string
  startTime: number
  endTime: number
}

export interface Subtitle {
  id: string
  language: string
  url: string
}

export interface VideoQuality {
  label: string
  url: string
  resolution: string
}

export interface PlaybackState {
  mediaId: string
  currentTime: number
  duration: number
  volume: number
  playbackRate: number
  isPlaying: boolean
  lastUpdated: Date
}

export interface MediaSession {
  id: string
  userId: string
  mediaId: string
  startTime: Date
  endTime?: Date
  totalWatched: number
  completionPercentage: number
  bookmarks: Bookmark[]
}

export interface Bookmark {
  id: string
  time: number
  title: string
  description?: string
  createdAt: Date
}

export enum MediaType {
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
  EBOOK = 'EBOOK'
}

export interface MediaError {
  code: string
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  context: Record<string, any>
  timestamp: Date
}

// Audio-specific interfaces for preventing echoing
export interface AudioManager {
  createAudioElement(): HTMLAudioElement
  destroyAudioElement(element: HTMLAudioElement): void
  preventDuplicateStreams(): void
  syncAudioElements(primary: HTMLAudioElement, secondary: HTMLAudioElement): () => void
}

export interface MediaPlayerState {
  currentMedia: MediaItem | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMinimized: boolean
  playbackHistory: PlaybackHistoryItem[]
}

export interface PlaybackHistoryItem {
  mediaId: string
  timestamp: Date
  position: number
  action: 'play' | 'pause' | 'seek' | 'stop'
}