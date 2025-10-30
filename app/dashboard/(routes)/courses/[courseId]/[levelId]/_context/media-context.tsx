'use client';

import { createContext, PropsWithChildren, useContext, useState } from 'react';
import { Media } from '../_data/schema';

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
    setIsFullscreen
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
