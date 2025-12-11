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
import { useMediaPlayer } from '@/app/_contexts/media-player-provider';
import { convertOfflineMediaToMediaItem, validateCachedMedia } from '@/app/_lib/offline-media-utils';
import { updateViewed } from '../../../home/[id]/action';
import { toast } from 'sonner';

const CACHE_NAME = 'media-cache-v6';

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
  const { loadMedia, loadPlaylist, play } = useMediaPlayer();

  const handleRowClick = async (offlineMedia: OfflineMedia, event: React.MouseEvent) => {
    // Prevent row click when clicking on action buttons or checkboxes
    const target = event.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="checkbox"]') || target.closest('.dropdown-menu')) {
      return;
    }

    try {
      // Validate that required fields exist
      if (!offlineMedia.id || !offlineMedia.url || !offlineMedia.type) {
        toast.error('Media data is incomplete. Please download it again.');
        return;
      }

      // Validate cache before attempting to play
      const validation = await validateCachedMedia(offlineMedia.url, offlineMedia.size);

      if (!validation.isValid) {
        toast.error(validation.message || 'Failed to load offline media');
        
        if (!validation.exists) {
          toast.info('Please download this media to play it offline.');
        } else if (validation.isCorrupted) {
          toast.info('Try downloading the media again.');
        }
        
        return;
      }

      // Convert offline media to MediaItem format with blob URL
      const mediaItem = await convertOfflineMediaToMediaItem(offlineMedia);

      // If we have multiple media items, load as playlist
      if (cachedMedia.length > 1) {
        // Validate and convert all media items for playlist
        const validMediaItems = [];
        
        for (const media of cachedMedia) {
          try {
            const validation = await validateCachedMedia(media.url, media.size);
            if (validation.isValid) {
              const convertedMedia = await convertOfflineMediaToMediaItem(media);
              validMediaItems.push(convertedMedia);
            }
          } catch (error) {
            console.warn(`Skipping invalid media: ${media.name}`, error);
          }
        }
        
        if (validMediaItems.length > 1) {
          const currentIndex = validMediaItems.findIndex(m => m.id === mediaItem.id);
          await loadPlaylist(validMediaItems, currentIndex >= 0 ? currentIndex : 0);
        } else {
          // Fallback to single media if playlist validation failed
          await loadMedia(mediaItem);
        }
      } else {
        // Single media item
        await loadMedia(mediaItem);
      }

      // Start playback
      await play();

      // Update viewed status
      updateViewed({ mediaId: offlineMedia.id });

    } catch (error) {
      console.error('[LibraryTable] Failed to play offline media:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to load offline media. Please try again.';
      
      toast.error(errorMessage);
    }
  };

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
