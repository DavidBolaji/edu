'use client';

import React from 'react';
import { Level } from '../_data/schema';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/app/_components/ui/dialog';
import { AlertDialogHeader } from '@/app/_components/ui/alert-dialog';
import LevelForm from './form/level-form';

interface Props {
  currentRow?: Level;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LevelActionDialog: React.FC<Props> = ({
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
          <DialogTitle>{isEdit ? 'Edit Level' : 'Add New Level'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the level here. ' : 'Create new level here. '}
            Click save when you&apos;re done.
          </DialogDescription>
        </AlertDialogHeader>
        <div className="-mr-4 w-full py-1 pr-4">
          <LevelForm currentRow={currentRow} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LevelActionDialog;
