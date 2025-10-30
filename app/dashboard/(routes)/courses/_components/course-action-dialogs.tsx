'use client';

import React from 'react';
import { Course } from '../_data/schema';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/app/_components/ui/dialog';
import { AlertDialogHeader } from '@/app/_components/ui/alert-dialog';
import CourseForm from './form/course-form';

interface Props {
  currentRow?: Course;
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
          <DialogTitle>{false ? 'Edit Course' : 'Add New Course'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the course here. ' : 'Create new course here. '}
            Click save when you&apos;re done.
          </DialogDescription>
        </AlertDialogHeader>
        <div className="-mr-4 w-full py-1 pr-4">
          <CourseForm currentRow={currentRow} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserActionDialog;
