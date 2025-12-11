'use client';

import { ColumnDef } from '@tanstack/react-table';
import { UserMedia } from '../../_data/schema';
import { Checkbox } from '@/app/_components/ui/checkbox';
import { DataTableColumnHeader } from '@/app/_components/table/data-table-column-header';
import LongText from '@/app/_components/table/long-text';
import { UserMediaTableRowActions } from './user-media-table-row-actions';
import { format } from 'date-fns';
import { cn, convertKbToMb } from '@/app/_lib/utils';
import DownloadButton from './download-button';
import { usePathname } from 'next/navigation';

export const columns: ColumnDef<UserMedia>[] = [
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
    id: 'size',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Size" />
    ),
    cell: ({ row }) => {
      const { size } = row.original;
      return <LongText className="max-w-36">{convertKbToMb(size)}</LongText>;
    },
  },
  {
    accessorKey: 'type',
    filterFn: (row, columnId, filterValue) => {
      // filterValue is an array of selected values
      return filterValue.includes(row.getValue(columnId));
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => {
      const { type } = row.original;
      return <LongText className="max-w-36">{type}</LongText>;
    },
  },
  {
    accessorFn: (row) => row.course.title,
    id: 'courseTitle',
    filterFn: (row, columnId, filterValue) => {
      // filterValue is an array of selected values
      return filterValue.includes(row.getValue(columnId));
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Course" />
    ),
    cell: ({ row }) => {
      const { course } = row.original;
      return <LongText className="max-w-36">{course.title}</LongText>;
    },
  },
  {
    accessorFn: (row) => row.level.name,
    id: 'levelName',
    filterFn: (row, columnId, filterValue) => {
      // filterValue is an array of selected values
      return filterValue.includes(row.getValue(columnId));
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Level" />
    ),
    cell: ({ row }) => {
      const { level } = row.original;
      return <LongText className="max-w-36">{level.name}</LongText>;
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
    id: 'download',
    header: 'Download',
    cell: ({ row }) => {
      const media = row.original;
      const pathname = usePathname(); // dynamically gets the current path

      function extractDashboardId(): string | null {
        const match = pathname.match(/^\/dashboard\/home\/([a-f0-9-]{36})$/);
        return match ? match[1] : null;
      }
      return (
        <DownloadButton
          mediaUrl={media.url}
          fileName={media.name}
          type={media.type}
          size={media.size}
          courseTitle={media.course.title}
          levelName={media.level.name}
          createdAt={media.createdAt.toISOString()}
          title={media.course.title}
          name={media.level.name}
          mediaId={media.id}
          educatorId={extractDashboardId() as unknown as string}
        />
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row, table }) => (
      <UserMediaTableRowActions 
        row={row} 
        allMedia={table.getRowModel().rows.map(r => r.original)}
      />
    ),
  },
];
