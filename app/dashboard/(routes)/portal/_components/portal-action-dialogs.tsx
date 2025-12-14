'use client';

import React from 'react';
import { Portal } from './table/schema';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/app/_components/ui/dialog';
import { AlertDialogHeader } from '@/app/_components/ui/alert-dialog';
import PortalForm from './form/portal-form';

interface Props {
  currentRow?: Portal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserActionDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  currentRow,
}) => {
  const isEdit = !!currentRow;
  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        onOpenChange(state);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <AlertDialogHeader className="text-left">
          <DialogTitle>{isEdit ? 'Edit Portal' : 'Add New Portal'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the portal here. ' : 'Create new portal here. '}
            Click save when you&apos;re done.
          </DialogDescription>
        </AlertDialogHeader>
        <div className="-mr-4 w-full py-1 pr-4 -mt-4">
          <PortalForm currentRow={currentRow} onClose={() => onOpenChange(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserActionDialog;
