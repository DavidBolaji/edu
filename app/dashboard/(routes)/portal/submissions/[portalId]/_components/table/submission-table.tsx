'use client';

import { useState, startTransition } from 'react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/_components/ui/table';
import { DataTableToolbar } from './submission-table-toolbar';
import { Submission } from '../../../../types';
import { useRouter, useParams } from 'next/navigation';

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    className: string;
  }
}

interface DataTableProps {
  columns: ColumnDef<Submission>[];
  data: Submission[];
  portalType?: 'AUDIO' | 'EBOOK' | 'VIDEO';
}

export function SubmissionTable({ columns, data, portalType }: DataTableProps) {
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [openingRowId, setOpeningRowId] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();

  const handleRowClick = (submission: Submission, event: React.MouseEvent) => {
    // Prevent row click when clicking on action buttons or checkboxes
    const target = event.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="checkbox"]') || target.closest('.dropdown-menu')) {
      return;
    }

    // Set active row for visual feedback
    setActiveRowId(submission.id);
    setOpeningRowId(submission.id);
    
    // Clear opening state quickly, keep active state longer
    setTimeout(() => {
      setOpeningRowId(null);
    }, 1000);
    
    setTimeout(() => {
      setActiveRowId(null);
    }, 3000);
    
    // Open media URL in new tab
    if (submission.url) {
      window.open(submission.url, '_blank', 'noopener,noreferrer');
    }
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
                  className={`group/row cursor-pointer hover:bg-muted/50 transition-colors duration-200 ${
                    activeRowId === row.original.id 
                      ? 'bg-blue-50 border-l-4 border-l-blue-500 shadow-sm' 
                      : 'hover:shadow-sm'
                  }`}
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
