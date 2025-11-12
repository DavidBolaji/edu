# Unified Media Player UI Components

This directory contains the unified media player UI components that provide a consistent interface for audio, video, and ebook content with multiple view modes.

## Components

### FullPlayerView
Complete media player interface with full controls and media display.

**Features:**
- Full-screen media display
- Complete playback controls (play, pause, seek, volume)
- Auto-hiding controls for video content
- Progress bar with time display
- Picture-in-picture support for video
- Error handling and loading states
- Keyboard navigation support

**Props:**
- `state: IMediaState` - Current media player state
- `onPlay: () => void` - Play button handler
- `onPause: () => void` - Pause button handler
- `onSeek: (position: number) => void` - Seek handler
- `onVolumeChange: (volume: number) => void` - Volume change handler
- `onMinimize: () => void` - Minimize to mini player
- `onClose: () => void` - Close player handler
- `onPictureInPicture?: () => void` - Picture-in-picture handler (video only)

### MiniPlayerView
Compact persistent player that stays at the bottom of the screen.

**Features:**
- Fixed positioning at bottom-right
- Essential playback controls
- Expandable for additional information
- Progress indicator
- Media thumbnail/icon display
- Playback rate controls (when expanded)

**Props:**
- `state: IMediaState` - Current media player state
- `onPlay: () => void` - Play button handler
- `onPause: () => void` - Pause button handler
- `onVolumeToggle: () => void` - Volume toggle handler
- `onMaximize: () => void` - Maximize to full player
- `onClose: () => void` - Close player handler

### PictureInPictureView
Draggable floating video player for video content.

**Features:**
- Draggable positioning
- Auto-hiding controls
- Essential video controls
- Progress indicator
- Video-only (automatically hidden for other media types)
- Viewport boundary constraints

**Props:**
- `state: IMediaState` - Current media player state
- `onPlay: () => void` - Play button handler
- `onPause: () => void` - Pause button handler
- `onVolumeToggle: () => void` - Volume toggle handler
- `onMaximize: () => void` - Maximize to full player
- `onClose: () => void` - Close player handler

### UnifiedMediaPlayer
Main orchestrator component that manages all view modes.

**Features:**
- Automatic view mode switching
- State management coordination
- Error handling
- Media loading coordination
- Cross-view mode state persistence

**Props:**
- `mediaPlayer?: IMediaPlayer` - Media player instance
- `initialMedia?: MediaItem` - Initial media to load
- `initialViewMode?: MediaViewMode` - Initial view mode
- `onStateChange?: (state: IMediaState) => void` - State change callback
- `onViewModeChange?: (mode: MediaViewMode) => void` - View mode change callback
- `onClose?: () => void` - Close callback

## Hook

### useMediaPlayer
React hook for managing media player state and controls.

**Features:**
- Media player lifecycle management
- State persistence
- Cross-tab synchronization
- Error handling
- Automatic cleanup

**Options:**
- `autoSaveInterval?: number` - Auto-save interval in milliseconds
- `enablePersistence?: boolean` - Enable state persistence
- `enableCrossTabSync?: boolean` - Enable cross-tab synchronization
- `onError?: (error: MediaPlayerError) => void` - Error callback
- `onStateChange?: (state: IMediaState) => void` - State change callback

**Returns:**
- State properties (state, viewMode, isLoading)
- Control methods (play, pause, seek, etc.)
- View mode controls (minimize, maximize, pictureInPicture)
- Player instance reference

## Usage Examples

### Basic Usage

```tsx
import { UnifiedMediaPlayer } from '@/app/_components/media-player';
import { MediaItem, MediaType } from '@/src/entities/models/media';

const media: MediaItem = {
  id: '1',
  name: 'Sample Video',
  type: MediaType.VIDEO,
  url: '/video.mp4',
  // ... other required properties
};

function MyComponent() {
  return (
    <UnifiedMediaPlayer
      initialMedia={media}
      onStateChange={(state) => console.log('State:', state)}
      onClose={() => console.log('Player closed')}
    />
  );
}
```

### Using the Hook

```tsx
import { useMediaPlayer } from '@/app/_hooks/use-media-player';

function MyComponent() {
  const {
    state,
    viewMode,
    loadMedia,
    play,
    pause,
    minimize,
    close
  } = useMediaPlayer({
    enablePersistence: true,
    onError: (error) => console.error(error)
  });

  return (
    <div>
      <button onClick={() => loadMedia(myMedia)}>Load Media</button>
      <button onClick={play}>Play</button>
      <button onClick={pause}>Pause</button>
      <button onClick={minimize}>Minimize</button>
      <button onClick={close}>Close</button>
    </div>
  );
}
```

### Individual Components

```tsx
import { FullPlayerView } from '@/app/_components/media-player';

function MyFullPlayer() {
  const [state, setState] = useState(/* initial state */);

  return (
    <FullPlayerView
      state={state}
      onPlay={() => {/* handle play */}}
      onPause={() => {/* handle pause */}}
      onSeek={(pos) => {/* handle seek */}}
      onVolumeChange={(vol) => {/* handle volume */}}
      onMinimize={() => {/* handle minimize */}}
      onClose={() => {/* handle close */}}
    />
  );
}
```

## Styling

The components use Tailwind CSS classes and follow the existing design system:

- **Colors**: Uses CSS custom properties from the design system
- **Spacing**: Follows the established spacing scale
- **Typography**: Uses the SpaceMono font family
- **Animations**: Smooth transitions with consistent timing
- **Responsive**: Mobile-first responsive design

## Accessibility

All components include:

- ARIA labels for screen readers
- Keyboard navigation support
- Focus indicators
- High contrast support
- Touch-friendly controls (44px minimum)

## Browser Support

- **Picture-in-Picture**: Modern browsers with PiP API support
- **Drag and Drop**: All modern browsers
- **Media Elements**: HTML5 video/audio support required
- **CSS Grid/Flexbox**: Modern browser support

## Testing

Components include data-testid attributes for testing:

- `data-testid="full-player-view"`
- `data-testid="mini-player-view"`
- `data-testid="picture-in-picture-view"`

## Integration with Media Player Core

These UI components are designed to work with the media player core services:

- `MediaPlayerCore` - Main player orchestration
- `AudioController` - Audio-specific functionality
- `VideoController` - Video-specific functionality
- `EbookController` - Ebook-specific functionality
- `PlaybackStateManager` - State persistence and synchronization

The components handle the UI layer while the core services manage the business logic and media handling.