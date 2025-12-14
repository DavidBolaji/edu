import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import { Row } from '@tanstack/react-table';
import { Portal } from './schema';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/app/_components/ui/dropdown-menu';
import { Button } from '@/app/_components/ui/button';
import { Edit, Trash2, ViewIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { usePortaleContext } from '../../_context/portal-context';
import { startTransition } from 'react';

interface DataTableRowActionsProps {
  row: Row<Portal>;
}

export function PortalTableRowActions({ row }: DataTableRowActionsProps) {
  const { setOpen, setCurrentRow, user } = usePortaleContext();
  const router = useRouter();
  
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

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const copyRoomLink = async () => {
      const roomUrl = `${window.location.origin}/dashboard/portal/${user?.id}`;
      try {
        await navigator.clipboard.writeText(roomUrl);
        alert('Link copied to clipboard')
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    };
    copyRoomLink()
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
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleCopyLink}>
            Copy Link
            <DropdownMenuShortcut>
              <ViewIcon size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
