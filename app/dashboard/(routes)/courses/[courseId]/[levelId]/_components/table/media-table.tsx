'use client';

import { useState } from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  RowData,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { DataTablePagination } from '@/app/_components/table/data-table-pagination';
import { Media } from '../../_data/schema';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/_components/ui/table';
import { DataTableToolbar } from './media-table-toolbar';
import { useMediaPlayer } from '@/app/_contexts/media-player-provider';
import { MediaItem, MediaType } from '@/src/entities/models/media';
import { useParams } from 'next/navigation';

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    className: string;
  }
}

interface DataTableProps {
  columns: ColumnDef<Media>[];
  data: Media[];
}

export function MediaTable({ columns, data }: DataTableProps) {
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const { loadMedia, loadPlaylist, play } = useMediaPlayer();
  const params = useParams();
  
  // Convert Media to MediaItem format
  const convertToMediaItem = (media: Media): MediaItem => ({
    id: media.id,
    name: media.name,
    type: media.type as MediaType,
    url: media.url,
    size: media.size,
    format: media.format,
    courseId: params.courseId as string,
    levelId: params.levelId as string,
    userId: '',
    createdAt: media.createdAt,
    updatedAt: media.updatedAt,
  });
  
  const handleRowClick = async (media: Media, event: React.MouseEvent) => {
    // Prevent row click when clicking on action buttons or checkboxes
    const target = event.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="checkbox"]') || target.closest('.dropdown-menu')) {
      return;
    }

    const mediaItem = convertToMediaItem(media);
    
    // If we have multiple media items, load as playlist
    if (data.length > 1) {
      const playlist = data.map(convertToMediaItem);
      const currentIndex = data.findIndex(m => m.id === media.id);
      await loadPlaylist(playlist, currentIndex >= 0 ? currentIndex : 0);
    } else {
      // Single media item
      await loadMedia(mediaItem);
    }
    
    // Start playback
    await play();
  };

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <div className="space-y-4 bg-white rounded-xl p-4">
      <DataTableToolbar table={table} />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="group/row">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className={header.column.columnDef.meta?.className ?? ''}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="group/row cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={(event) => handleRowClick(row.original, event)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cell.column.columnDef.meta?.className ?? ''}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
