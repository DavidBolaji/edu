'use client';

import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import { Row } from '@tanstack/react-table';
import { Media } from '../../_data/schema';
import { useMediaDialogContext } from '../../_context/media-dialog-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/app/_components/ui/dropdown-menu';
import { Button } from '@/app/_components/ui/button';
import { Edit, Trash2 } from 'lucide-react';

interface DataTableRowActionsProps {
  row: Row<Media>;
  allMedia?: Media[];
}

export function MediaTableRowActions({ row }: DataTableRowActionsProps) {
  const { setOpen, setCurrentRow } = useMediaDialogContext();
  
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentRow(row.original);
    setOpen('edit');
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentRow(row.original);
    setOpen('delete');
  };

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted flex h-8 w-8 p-0"
            onClick={(e) => e.stopPropagation()}
          >
            <DotsHorizontalIcon className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem onClick={handleEdit}>
            Edit
            <DropdownMenuShortcut>
              <Edit size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDelete} className="text-red-500">
            Delete
            <DropdownMenuShortcut>
              <Trash2 size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
