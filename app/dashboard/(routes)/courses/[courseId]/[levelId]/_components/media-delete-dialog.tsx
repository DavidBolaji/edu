'use client';

import { useState, useTransition } from 'react';
import { Media } from '../_data/schema';
import { deleteMedia } from '../action';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

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
  currentRow: Media;
}

export function MediaDeleteDialog({ open, onOpenChange, currentRow }: Props) {
  const [value, setValue] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    if (value.trim() !== currentRow.name) return;

    startTransition(async () => {
      try {
        const result = await deleteMedia({ id: currentRow.id });
        if (result[0]?.success) {
          toast.success('Media deleted successfully');
          onOpenChange(false);
          setValue('');
          router.refresh();
        } else {
          toast.error('Failed to delete media');
        }
      } catch (error) {
        toast.error('An error occurred while deleting the media');
      }
    });
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleDelete}
      disabled={value.trim() !== currentRow.name || isPending}
      isLoading={isPending}
      title={
        <span className="text-destructive">
          <AlertTriangle
            className="stroke-destructive mr-1 inline-block"
            size={18}
          />{' '}
          Delete Media
        </span>
      }
      desc={
        <div className="space-y-4">
          <p className="mb-2">
            Are you sure you want to delete{' '}
            <span className="font-bold">{currentRow?.name}</span>?
            <br />
            This action will permanently remove the Media with the name of{' '}
            <span className="font-bold">
              {currentRow?.name?.toUpperCase()}
            </span>{' '}
            from the system. This cannot be undone.
          </p>

          <Label className="my-2">
            Name:
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter media name to confirm deletion."
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
