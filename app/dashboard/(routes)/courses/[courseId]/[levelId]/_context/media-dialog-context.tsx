'use client';

import { createContext, PropsWithChildren, useContext, useState } from 'react';
import { Media } from '../_data/schema';

type MediaDialogType = 'add' | 'edit' | 'delete';

interface MediaDialogContextType {
  open: MediaDialogType | null;
  setOpen: (str: MediaDialogType | null) => void;
  currentRow: Media | null;
  setCurrentRow: React.Dispatch<React.SetStateAction<Media | null>>;
}

const MediaDialogContext = createContext<MediaDialogContextType | null>(null);

export const MediaDialogProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [open, setOpen] = useState<MediaDialogType | null>(null);
  const [currentRow, setCurrentRow] = useState<Media | null>(null);

  const values = {
    open,
    setOpen,
    currentRow,
    setCurrentRow,
  };
  
  return (
    <MediaDialogContext.Provider value={values}>
      {children}
    </MediaDialogContext.Provider>
  );
};

export const useMediaDialogContext = () => {
  const context = useContext(MediaDialogContext);
  if (!context) {
    throw new Error('useMediaDialogContext must be used within MediaDialogProvider');
  }
  return context;
};
