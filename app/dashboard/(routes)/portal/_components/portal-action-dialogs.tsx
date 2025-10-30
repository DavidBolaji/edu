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
        window.location.reload();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <AlertDialogHeader className="text-left">
          <DialogTitle>Edit Course</DialogTitle>
          <DialogDescription>
            Update the Portal here {' '}
            Click save when you&apos;re done.
          </DialogDescription>
        </AlertDialogHeader>
        <div className="-mr-4 w-full py-1 pr-4 -mt-4">
          <PortalForm currentRow={currentRow} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserActionDialog;
