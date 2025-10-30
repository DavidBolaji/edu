import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import { Row } from '@tanstack/react-table';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/app/_components/ui/dropdown-menu';
import { Button } from '@/app/_components/ui/button';
import {  ViewIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Submission } from '../../../../types';

interface DataTableRowActionsProps {
  row: Row<Submission>;
}

export function SubmissionTableRowActions({ row }: DataTableRowActionsProps) {

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
              router.push(`${row.original.url}`);
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
