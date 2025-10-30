'use client';

import { createContext, PropsWithChildren, useContext, useState } from 'react';
import { Level } from '../_data/schema';

type LevelsDialogType = 'add' | 'edit' | 'delete';

interface LevelsContextType {
  open: LevelsDialogType | null;
  setOpen: (str: LevelsDialogType | null) => void;
  currentRow: Level | null;
  setCurrentRow: React.Dispatch<React.SetStateAction<Level | null>>;
}

const LevelContext = createContext<LevelsContextType | null>(null);

export const LevelsContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [open, setOpen] = useState<LevelsDialogType | null>(null);
  const [currentRow, setCurrentRow] = useState<Level | null>(null);

  const values = {
    open,
    setOpen,
    currentRow,
    setCurrentRow,
  };
  return (
    <LevelContext.Provider value={values}>{children}</LevelContext.Provider>
  );
};

export const useLevelContext = () => {
  const levelsContext = useContext(LevelContext);
  if (!levelsContext) {
    throw new Error('useLevels has to be used within <LevelsContext>');
  }

  return levelsContext;
};
