'use client';

import React from 'react';
import { Media } from '../_data/schema';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/app/_components/ui/dialog';
import { AlertDialogHeader } from '@/app/_components/ui/alert-dialog';
import MediaForm from './form/media-form';

interface Props {
  currentRow?: Media;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MediaActionDialog: React.FC<Props> = ({
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
          <DialogTitle>{false ? 'Edit Media' : 'Add New Media'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the media here. ' : 'Create new media here. '}
            Click save when you&apos;re done.
          </DialogDescription>
        </AlertDialogHeader>
        <div className="-mr-4 w-full py-1 pr-4">
          <MediaForm currentRow={currentRow} onClose={() => onOpenChange(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaActionDialog;
