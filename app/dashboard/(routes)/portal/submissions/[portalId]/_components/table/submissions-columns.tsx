'use client';

import React from 'react';
import { ColumnDef } from '@tanstack/react-table';

import { Checkbox } from '@/app/_components/ui/checkbox';
import { DataTableColumnHeader } from '@/app/_components/table/data-table-column-header';
import LongText from '@/app/_components/table/long-text';
import { SubmissionTableRowActions } from './submission-table-row-actions';
import { format } from 'date-fns';
import { cn } from '@/app/_lib/utils';
import { Submission } from '../../../../types';

export const createColumns = (portalType?: 'AUDIO' | 'EBOOK' | 'VIDEO'): ColumnDef<Submission>[] => {
  

  const getMediaLabel = (type?: 'AUDIO' | 'EBOOK' | 'VIDEO') => {
    switch (type) {
      case 'AUDIO': return 'Listen';
      case 'VIDEO': return 'Watch';
      case 'EBOOK': return 'Read';
      default: return 'View Media';
    }
  };

  return [
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
    accessorKey: 'userFname',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="First Name" />
    ),
    cell: ({ row }) => {
      const { user } = row.original;
      return <LongText className="max-w-36">{user?.fname}</LongText>;
    },
    enableSorting:false,
    enableHiding: false
  },
  {
    accessorKey: 'userLname',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last Name" />
    ),
    cell: ({ row }) => {
      const { user } = row.original;
      return <LongText className="max-w-36">{user?.lname}</LongText>;
    },
    enableSorting:false,
    enableHiding: false
  },
  {
    accessorKey: 'url',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Media" />
    ),
    cell: ({ row }) => {
      const { url } = row.original;
      
      if (!url) return <span className="text-muted-foreground">No media</span>;
      
      const handleMediaClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        window.open(url, '_blank', 'noopener,noreferrer');
      };

      return (
        <button
          onClick={handleMediaClick}
          title={`Click to open ${portalType?.toLowerCase() || 'media'} in new tab`}
          className="text-blue-600 font-medium"
        >
          
          {getMediaLabel(portalType)}
        </button>
      );
    },
    enableSorting: false,
    enableHiding: false
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
          {format(createdAt.toString(), 'do MMM, yyyy')}
        </LongText>
      );
    },

    enableSorting: false,
  },
  {
    id: 'actions',
    cell: SubmissionTableRowActions,
  },
];
};

// Export default columns for backward compatibility
export const columns: ColumnDef<Submission>[] = createColumns();
