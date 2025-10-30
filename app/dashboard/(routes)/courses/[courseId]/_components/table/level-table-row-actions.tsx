import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import { Row } from '@tanstack/react-table';
import { Level } from '../../_data/schema';
import { useLevelContext } from '../../_context/level-context';
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
import { useParams, useRouter } from 'next/navigation';

interface DataTableRowActionsProps {
  row: Row<Level>;
}

export function LevelTableRowActions({ row }: DataTableRowActionsProps) {
  const { setOpen, setCurrentRow } = useLevelContext();
  const { courseId } = useParams();
  const router = useRouter();
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
              router.push(`/dashboard/courses/${courseId}/${row.original.id}`);
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
