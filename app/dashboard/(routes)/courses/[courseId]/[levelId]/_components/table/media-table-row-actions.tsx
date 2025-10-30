import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import { Row } from '@tanstack/react-table';
import { Media } from '../../_data/schema';
import { useMediaContext } from '../../_context/media-context';
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

interface DataTableRowActionsProps {
  row: Row<Media>;
}

export function MediaTableRowActions({ row }: DataTableRowActionsProps) {
  const { setCurrentRow, setOpen, setViewerType } = useMediaContext();

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted flex h-8 w-8 p-0"
          >
            <DotsHorizontalIcon className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(row.original);
              setOpen('edit');
            }}
          >
            Edit
            <DropdownMenuShortcut>
              <Edit size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(row.original);
              setOpen('delete');
            }}
            className="text-red-500!"
          >
            Delete
            <DropdownMenuShortcut>
              <Trash2 size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              const { type } = row.original;
              setCurrentRow(row.original);

              if (type === 'EBOOK') {
                setViewerType('ebook');
              } else if (type === 'AUDIO') {
                setViewerType('audio');
              } else if (type === 'VIDEO') {
                setViewerType('video');
              }

              setOpen('viewer');
            }}
            className="text-red-500!"
          >
            View
            <DropdownMenuShortcut>
              <ViewIcon size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
