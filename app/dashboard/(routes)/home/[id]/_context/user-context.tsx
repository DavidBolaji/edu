'use client';

import { createContext, PropsWithChildren, useContext, useState } from 'react';
import { UserMedia } from '../_data/schema';

type UserDialogType = 'add' | 'edit' | 'delete';

interface UserContextType {
  open: UserDialogType | null;
  setOpen: (str: UserDialogType | null) => void;
  currentRow: UserMedia | null;
  setCurrentRow: React.Dispatch<React.SetStateAction<UserMedia | null>>;
}

const UserContext = createContext<UserContextType | null>(null);

export const UserContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [open, setOpen] = useState<UserDialogType | null>(null);
  const [currentRow, setCurrentRow] = useState<UserMedia | null>(null);

  const values = {
    open,
    setOpen,
    currentRow,
    setCurrentRow,
  };
  return <UserContext.Provider value={values}>{children}</UserContext.Provider>;
};

export const useUserContext = () => {
  const coursesContext = useContext(UserContext);
  if (!coursesContext) {
    throw new Error('useUser has to be used within <UserContext>');
  }

  return coursesContext;
};
