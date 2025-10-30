'use client';

import { useState } from 'react';
import { Level } from '../_data/schema';

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
  currentRow: Level;
}

export function LevelDeleteDialog({ open, onOpenChange, currentRow }: Props) {
  const [value, setValue] = useState('');

  const handleDelete = () => {
    if (value.trim() !== currentRow.name) return;

    onOpenChange(false);
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleDelete}
      disabled={value.trim() !== currentRow.name}
      title={
        <span className="text-destructive">
          <AlertTriangle
            className="stroke-destructive mr-1 inline-block"
            size={18}
          />{' '}
          Delete Level
        </span>
      }
      desc={
        <div className="space-y-4">
          <p className="mb-2">
            Are you sure you want to delete{' '}
            <span className="font-bold">{currentRow.name}</span>?
            <br />
            This action will permanently remove the Level with the name of{' '}
            <span className="font-bold">
              {currentRow.name.toUpperCase()}
            </span>{' '}
            from the system. This cannot be undone.
          </p>

          <Label className="my-2">
            Title:
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter course title to confirm deletion."
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
