# Media Player Core

A modular media player implementation following the Single Responsibility Principle (SRP). Each component has a focused responsibility, making the system maintainable, testable, and extensible.

## Architecture

### Core Components

1. **MediaPlayerCore** - Main orchestrator that coordinates all controllers
2. **AudioController** - Handles audio-specific playback (prevents echoing)
3. **VideoController** - Handles video playback with Picture-in-Picture support
4. **EbookController** - Handles ebook display and navigation
5. **PlaybackStateManager** - Persists playback state across navigation using IndexedDB
6. **MediaUIController** - Manages UI state and visual presentation

## Usage

### Basic Setup

```typescript
import { MediaPlayerCore } from '@/src/application/services/media-player';
import { MediaItem } from '@/src/entities/models/media';

// Get container element
const container = document.getElementById('media-player-container');

// Create player instance
const player = new MediaPlayerCore(container, {
  autoSaveInterval: 5000,
  enablePictureInPicture: true,
  enableMiniPlayer: true,
  defaultVolume: 0.8,
  defaultPlaybackRate: 1.0
});

// Load and play media
const media: MediaItem = {
  id: 'media-123',
  name: 'Introduction to React',
  type: 'VIDEO',
  url: 'https://example.com/video.mp4',
  size: 1024000,
  format: 'mp4',
  courseId: 'course-1',
  levelId: 'level-1',
  userId: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date()
};

await player.load(media);
await player.play();
```

### Playback Controls

```typescript
// Play/Pause
await player.play();
player.pause();
player.stop();

// Seek to position (in seconds)
player.seek(120); // Seek to 2 minutes

// Volume control (0-1)
player.setVolume(0.5);

// Playback rate (0.25-2.0)
player.setPlaybackRate(1.5); // 1.5x speed
```

### UI Controls

```typescript
// Minimize player
player.minimize();

// Maximize player
player.maximize();

// Picture-in-Picture (video only)
await player.togglePictureInPicture();

// Close player
player.close();
```

### State Management

```typescript
// Get current state
const state = player.getState();
console.log(state.currentTime, state.duration, state.isPlaying);

// State is automatically saved to IndexedDB every 5 seconds
// and restored when loading the same media again
```

### Advanced State Management

```typescript
import { PlaybackStateManager } from '@/src/application/services/media-player';

// Create state manager with custom configuration
const stateManager = new PlaybackStateManager();

// Manual state operations
const state = {
  mediaId: 'media-123',
  currentTime: 120,
  duration: 300,
  volume: 0.8,
  playbackRate: 1.0,
  isPlaying: true,
  lastUpdated: new Date()
};

// Save state
await stateManager.saveState(state);

// Load state
const loadedState = await stateManager.loadState('media-123');

// Start auto-save with custom interval
stateManager.startAutoSave(() => getCurrentState(), 3000); // 3 seconds

// Enable/disable cross-tab synchronization
stateManager.enableCrossTabSync(true);

// Listen for state restoration events
stateManager.onStateRestored((restoredState) => {
  console.log('State restored from another tab:', restoredState);
  // Update UI with restored state
});

// Export states for backup
const allStates = await stateManager.exportStates();

// Import states from backup
await stateManager.importStates(backupStates);

// Cleanup old states (older than 30 days)
await stateManager.cleanupOldStates(30);
```

### Cross-Tab Synchronization

The system automatically synchronizes playback state across browser tabs:

```typescript
// Tab 1: User pauses video at 2:30
player.pause(); // State automatically saved and broadcast

// Tab 2: State is automatically synchronized
// User sees video paused at 2:30 when they switch tabs
```

### Cleanup

```typescript
// Clean up when component unmounts
await player.cleanup();
```

## Features

### Audio Controller
- Prevents duplicate audio streams and echoing
- Single audio element management
- Automatic cleanup on navigation

### Video Controller
- Picture-in-Picture support
- Mobile-friendly (playsInline)
- Custom controls ready

### Ebook Controller
- Page-based navigation
- Progress tracking
- Simulated reading time

### Playback State Manager
- **Persistent Storage**: IndexedDB-based state persistence with automatic cleanup
- **Auto-save**: Configurable interval (default 5 seconds) with intelligent change detection
- **Cross-tab Sync**: BroadcastChannel-based synchronization across browser tabs
- **State Restoration**: Automatic restoration on app restart and page navigation
- **Export/Import**: Backup and migration support for playback states
- **Cleanup**: Automatic removal of old states (configurable retention period)

### Media UI Controller
- Mini player mode
- Full screen support
- Auto-hiding controls
- Loading and error states
- Progress display

## Requirements Addressed

- **Requirement 4.1**: Unified media player with consistent controls
- **Requirement 4.2**: Playback state persistence across page navigation
- **Requirement 4.7**: Cross-page navigation persistence
- **Requirement 5.1**: SOLID architecture with single responsibility principle

## Extension Points

### Adding New Media Types

```typescript
import { IMediaHandler } from '@/src/entities/models/media-player';

class CustomMediaController implements IMediaHandler {
  canHandle(mediaType: string): boolean {
    return mediaType === 'CUSTOM';
  }
  
  // Implement other interface methods...
}

// Register in MediaPlayerCore.registerHandlers()
this.handlers.set('CUSTOM', new CustomMediaController());
```

### Custom Error Handling

```typescript
const state = player.getState();
if (state.error) {
  console.error('Media error:', state.error.code, state.error.message);
  
  switch (state.error.severity) {
    case 'critical':
      // Handle critical errors
      break;
    case 'high':
      // Handle high priority errors
      break;
    // ...
  }
}
```

## Testing

Each controller can be tested independently:

```typescript
import { AudioController } from '@/src/application/services/media-player';

describe('AudioController', () => {
  it('should prevent duplicate audio streams', async () => {
    const controller = new AudioController();
    const container = document.createElement('div');
    
    await controller.initialize(container);
    // Test implementation...
  });
});
```
