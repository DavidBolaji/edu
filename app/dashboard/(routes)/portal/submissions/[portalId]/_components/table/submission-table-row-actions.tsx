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
import { ViewIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Submission } from '../../../../types';
import { startTransition } from 'react';

interface DataTableRowActionsProps {
  row: Row<Submission>;
}

export function SubmissionTableRowActions({ row }: DataTableRowActionsProps) {

  const router = useRouter();
  // No actions needed - view is handled by row click
  return null;
}
