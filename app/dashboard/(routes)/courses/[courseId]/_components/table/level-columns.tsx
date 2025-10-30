'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Level } from '../../_data/schema';
import { Checkbox } from '@/app/_components/ui/checkbox';
import { DataTableColumnHeader } from '@/app/_components/table/data-table-column-header';
import LongText from '@/app/_components/table/long-text';
import { LevelTableRowActions } from './level-table-row-actions';
import { format } from 'date-fns';
import { cn } from '@/app/_lib/utils';

export const columns: ColumnDef<Level>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    meta: {
      className: cn(
        'sticky bg-red-400 md:table-cell left-0 z-10 rounded-tl',
        'bg-background transition-colors duration-200 group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted'
      ),
    },

    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    // enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      const { name } = row.original;
      return <LongText className="max-w-36">{name}</LongText>;
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => {
      const { createdAt } = row.original;

      return (
        <LongText className="max-w-36">
          {format(createdAt.toISOString(), 'do MMM, yyyy')}
        </LongText>
      );
    },

    enableSorting: false,
  },
  {
    id: 'actions',
    cell: LevelTableRowActions,
  },
];
