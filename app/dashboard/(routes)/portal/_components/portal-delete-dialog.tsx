'use client';

import { useState, useTransition } from 'react';
import { Portal } from './table/schema';
import { deletePortal } from '../action';
import { toast } from 'sonner';
import { usePortaleContext } from '../_context/portal-context';

import { AlertTriangle } from 'lucide-react';
import { Label } from '@/app/_components/ui/label';
import { Input } from '@/app/_components/ui/input';
import { ConfirmDialog } from '@/app/_components/ui/confirm-dialog';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/app/_components/ui/alert';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRow: Portal;
}

export function PortalsDeleteDialog({ open, onOpenChange, currentRow }: Props) {
  const [value, setValue] = useState('');
  const [isPending, startTransition] = useTransition();
  const { onDelete } = usePortaleContext();

  const handleDelete = () => {
    if (value.trim() !== currentRow.course) return;

    startTransition(async () => {
      try {
        const result = await deletePortal({ id: currentRow.id });
        if (result[0]?.success) {
          toast.success('Portal deleted successfully');
          onOpenChange(false);
          setValue('');
          onDelete(currentRow.id); // Update the local state
        } else {
          toast.error('Failed to delete portal');
        }
      } catch (error) {
        toast.error('An error occurred while deleting the portal');
      }
    });
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleDelete}
      disabled={value.trim() !== currentRow.course || isPending}
      isLoading={isPending}
      title={
        <span className="text-destructive">
          <AlertTriangle
            className="stroke-destructive mr-1 inline-block"
            size={18}
          />{' '}
          Delete Portal
        </span>
      }
      desc={
        <div className="space-y-4">
          <p className="mb-2">
            Are you sure you want to delete{' '}
            <span className="font-bold">{currentRow.course}</span>?
            <br />
            This action will permanently remove the Portal
            from the system. This cannot be undone.
          </p>

          <Label className="my-2">
            <span className='inline-block mb-2 ml-0.5'>Course:</span>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter Portal Course to confirm deletion."
            />
          </Label>

          <Alert variant="destructive">
            <AlertTitle>Warning!</AlertTitle>
            <AlertDescription>
              Please be carefull, this operation can not be rolled back.
            </AlertDescription>
          </Alert>
        </div>
      }
      confirmText="Delete"
      destructive
    />
  );
}
