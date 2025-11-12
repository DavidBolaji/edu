'use client';

import { createContext, PropsWithChildren, useContext, useState, useEffect, useCallback } from 'react';
import { Media } from '../_data/schema';
import { AudioManagerService } from '@/src/application/services/audio-manager.service';

type ViewerType = 'audio' | 'video' | 'ebook' | null;
type MediasDialogType = 'add' | 'edit' | 'delete' | 'viewer';

interface MediasContextType {
  open: MediasDialogType | null;
  setOpen: (str: MediasDialogType | null) => void;
  currentRow: Media | null;
  setCurrentRow: React.Dispatch<React.SetStateAction<Media | null>>;
  viewerType: ViewerType;
  setViewerType: (type: ViewerType) => void;
  playlist: Media[]
  setPlaylist: React.Dispatch<React.SetStateAction<Media[]>>
  currentIndex: number
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>
  isMinimized: boolean
  setIsMinimized: React.Dispatch<React.SetStateAction<boolean>>
  isFullscreen: boolean
  setIsFullscreen: React.Dispatch<React.SetStateAction<boolean>>
  cleanupMedia: () => void;
}

const MediaContext = createContext<MediasContextType | null>(null);

export const MediasContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [open, setOpen] = useState<MediasDialogType | null>(null)
  const [currentRow, setCurrentRow] = useState<Media | null>(null)
  const [viewerType, setViewerType] = useState<ViewerType>(null)
  const [playlist, setPlaylist] = useState<Media[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Function to cleanup media
  const cleanupMedia = useCallback(() => {
    if (typeof window !== 'undefined') {
      const audioManager = AudioManagerService.getInstance()
      audioManager.pauseAllAudio()
      audioManager.cleanup()
    }
    setCurrentRow(null)
    setViewerType(null)
    setIsMinimized(false)
  }, [])

  // Cleanup media when component unmounts or when switching away from media
  useEffect(() => {
    return () => {
      cleanupMedia()
    }
  }, [cleanupMedia])

  const values = {
    open,
    setOpen,
    currentRow,
    setCurrentRow,
    viewerType,
    setViewerType,
    playlist,
    setPlaylist,
    currentIndex,
    setCurrentIndex,
    isMinimized,
    setIsMinimized,
    isFullscreen,
    setIsFullscreen,
    cleanupMedia
  };
  return (
    <MediaContext.Provider value={values}>{children}</MediaContext.Provider>
  );
};

export const useMediaContext = () => {
  const levelsContext = useContext(MediaContext);
  if (!levelsContext) {
    throw new Error('useMedias has to be used within <MediasContext>');
  }

  return levelsContext;
};
