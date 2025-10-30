import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import { Row } from '@tanstack/react-table';
import { UserMedia } from '../../_data/schema';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/app/_components/ui/dropdown-menu';
import { Button } from '@/app/_components/ui/button';
import { ViewIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMediaContext } from '@/app/dashboard/(routes)/courses/[courseId]/[levelId]/_context/media-context';
import { updateViewed } from '../../action';

interface DataTableRowActionsProps {
  row: Row<UserMedia>;
}

export function UserMediaTableRowActions({ row }: DataTableRowActionsProps) {
  const router = useRouter();
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
              updateViewed({ mediaId: row.original.id });
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
