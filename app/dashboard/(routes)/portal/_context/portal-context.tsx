'use client';

import { createContext, PropsWithChildren, useContext, useState } from 'react';
import { Portal } from '../_components/table/schema';
import { UserDetail } from '@/src/entities/models/user';

type PortalDialogType = 'add' | 'edit' | 'delete';

interface PortalContextType {
  open: PortalDialogType | null;
  setOpen: (str: PortalDialogType | null) => void;
  currentRow: Portal | null;
  setCurrentRow: React.Dispatch<React.SetStateAction<Portal | null>>;
  user: UserDetail;
  onUpdate: (portal: Portal) => void;
  onDelete: (portalId: string) => void;
  onRefresh: () => void;
}

const PortalsContext = createContext<PortalContextType | null>(null);

export const PortalContextProvider: React.FC<PropsWithChildren & {
  user: UserDetail;
  onUpdate: (portal: Portal) => void;
  onDelete: (portalId: string) => void;
  onRefresh: () => void;
}> = ({ children, user, onUpdate, onDelete, onRefresh }) => {
  const [open, setOpen] = useState<PortalDialogType | null>(null);
  const [currentRow, setCurrentRow] = useState<Portal | null>(null);

  const values: PortalContextType = {
    open,
    setOpen,
    currentRow,
    setCurrentRow,
    user,
    onUpdate,
    onDelete,
    onRefresh
  };

  return (
    <PortalsContext.Provider value={values}>
      {children}
    </PortalsContext.Provider>
  );
};

export const usePortaleContext = () => {
  const context = useContext(PortalsContext);
  if (!context) {
    throw new Error('usePortaleContext must be used within <PortalContextProvider>');
  }
  return context;
};
