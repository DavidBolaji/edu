'use client';

import { useState, useEffect } from 'react';
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

import { DataTableToolbar } from './user-media-table-toolbar';
import { DataTablePagination } from '@/app/_components/table/data-table-pagination';
import { OfflineMedia } from '../../_data/schema';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/_components/ui/table';
import { openDatabase } from '@/app/_lib/indexed-db';

const CACHE_NAME = 'media-cache-v5';

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    className: string;
  }
}

interface DataTableProps {
  columns: ColumnDef<OfflineMedia>[];
}

export function LibraryMediaTable({ columns }: DataTableProps) {
  const [cachedMedia, setCachedMedia] = useState<OfflineMedia[]>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);

  // Migration function to fix old metadata structure
  const migrateMetadata = (metadata: any): OfflineMedia | null => {
    try {
      // Check if metadata has required fields
      if (!metadata.id) {
        metadata.id = metadata.url || `media-${Date.now()}`;
      }
      if (!metadata.name) {
        metadata.name = metadata.fileName || 'Unknown Media';
      }
      if (!metadata.format) {
        metadata.format = metadata.fileName?.split('.').pop() || 'unknown';
      }
      if (!metadata.type || typeof metadata.type !== 'string') {
        metadata.type = 'EBOOK'; // Default fallback
      } else {
        // Ensure type is uppercase and valid
        metadata.type = metadata.type.toUpperCase();
        if (!['AUDIO', 'VIDEO', 'EBOOK'].includes(metadata.type)) {
          metadata.type = 'EBOOK';
        }
      }
      if (!metadata.updatedAt) {
        metadata.updatedAt = metadata.createdAt || new Date();
      }
      if (!metadata.course) {
        metadata.course = { title: metadata.courseTitle || 'Unknown Course' };
      }
      if (!metadata.level) {
        metadata.level = { name: metadata.levelName || 'Unknown Level' };
      }
      
      // Ensure dates are Date objects
      if (typeof metadata.createdAt === 'string') {
        metadata.createdAt = new Date(metadata.createdAt);
      }
      if (typeof metadata.updatedAt === 'string') {
        metadata.updatedAt = new Date(metadata.updatedAt);
      }
      
      return metadata as OfflineMedia;
    } catch (error) {
      console.error('Failed to migrate metadata:', error);
      return null;
    }
  };

  // Fetch all cached metadata + validate blobs
  const fetchCachedMedia = async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      const db = await openDatabase();
      const tx = db.transaction('mediaMetadata', 'readonly');
      const store = tx.objectStore('mediaMetadata');
      const request = store.getAll();

      request.onsuccess = async () => {
        const allMetadata = request.result as any[];

        const validCached: OfflineMedia[] = [];
        for (const rawMetadata of allMetadata) {
          try {
            const response = await cache.match(rawMetadata.url);
            if (response) {
              // Migrate old metadata structure to new format
              const migratedMetadata = migrateMetadata(rawMetadata);
              if (migratedMetadata) {
                validCached.push(migratedMetadata);
              }
            }
          } catch (error) {
            console.error('Error processing cached media:', error);
          }
        }

        setCachedMedia(validCached);
      };

      request.onerror = () => {
        console.error('Failed to get metadata from IndexedDB');
      };
    } catch (error) {
      console.error('Error fetching cached media:', error);
    }
  };

  // Function to clean up corrupted cache entries
  const cleanupCorruptedEntries = async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      const db = await openDatabase();
      const tx = db.transaction('mediaMetadata', 'readwrite');
      const store = tx.objectStore('mediaMetadata');
      const request = store.getAll();

      request.onsuccess = async () => {
        const allMetadata = request.result as any[];
        let cleanedCount = 0;

        for (const metadata of allMetadata) {
          try {
            // Check if cache entry exists
            const response = await cache.match(metadata.url);
            if (!response) {
              // Remove orphaned metadata
              await store.delete(metadata.url);
              cleanedCount++;
              continue;
            }

            // Check if metadata is malformed
            if (!metadata.id || !metadata.type || !metadata.url) {
              // Remove malformed entries
              await cache.delete(metadata.url);
              await store.delete(metadata.url);
              cleanedCount++;
            }
          } catch (error) {
            console.error('Error cleaning up entry:', error);
          }
        }

        if (cleanedCount > 0) {
          console.log(`Cleaned up ${cleanedCount} corrupted cache entries`);
          fetchCachedMedia(); // Refresh the table
        }
      };
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  };

  useEffect(() => {
    fetchCachedMedia();
    // Clean up corrupted entries on mount
    cleanupCorruptedEntries();
  }, []);

  const table = useReactTable({
    data: cachedMedia || [],
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
    meta: {
      refreshData: fetchCachedMedia,
    },
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
                  className="group/row"
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
