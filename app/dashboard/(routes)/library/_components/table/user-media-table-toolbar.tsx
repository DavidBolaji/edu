import { Table } from '@tanstack/react-table';
import { Input } from '@/app/_components/ui/input';
import useCourseTitle from '../../_hooks/use-course-title';
import { DataTableFacetedFilter } from '@/app/_components/table/data-table-faceted-filter';
import { Button } from '@/app/_components/ui/button';
import { Crosshair2Icon, TrashIcon } from '@radix-ui/react-icons';
import useLevelName from '../../_hooks/use-level-name';
import { toast } from 'sonner';
import { openDatabase } from '@/app/_lib/indexed-db';
import { useState } from 'react';

// import { DataTableViewOptions } from './data-table-view-options'
interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const { courses } = useCourseTitle();
  const { levels } = useLevelName();
  const [isClearing, setIsClearing] = useState(false);

  const handleClearAllCache = async () => {
    if (!confirm('Are you sure you want to clear all cached media? This will remove all offline content.')) {
      return;
    }

    setIsClearing(true);
    try {
      // Clear cache
      const cache = await caches.open('media-cache-v7');
      const keys = await cache.keys();
      await Promise.all(keys.map(key => cache.delete(key)));

      // Clear IndexedDB
      const db = await openDatabase();
      const tx = db.transaction('mediaMetadata', 'readwrite');
      const store = tx.objectStore('mediaMetadata');
      await store.clear();

      toast.success('All cached media cleared successfully');
      
      // Refresh table
      (table.options.meta as any)?.refreshData?.();
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast.error('Failed to clear cache');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2">
        <Input
          placeholder="Filter media by name..."
          value={
            (table.getColumn('fileName')?.getFilterValue() as string) ?? ''
          }
          onChange={(event) =>
            table.getColumn('fileName')?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        <div className="flex gap-x-2">
          {table.getColumn('type') && (
            <DataTableFacetedFilter
              column={table.getColumn('type')}
              title="Type"
              options={[
                { label: 'Audio', value: 'AUDIO' },
                { label: 'Video', value: 'VIDEO' },
                { label: 'Ebook', value: 'EBOOK' },
              ]}
            />
          )}
          {table.getColumn('courseTitle') && (
            <DataTableFacetedFilter
              column={table.getColumn('courseTitle')}
              title="Course"
              options={courses || []}
            />
          )}
          {table.getColumn('levelName') && (
            <DataTableFacetedFilter
              column={table.getColumn('levelName')}
              title="Level"
              options={levels || []}
            />
          )}
        </div>
      </div>
      <div className="flex items-center space-x-1 sm:space-x-2">
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-1 sm:px-2 lg:px-3 text-xs sm:text-sm"
          >
            <span className="hidden sm:inline">Reset</span>
            <span className="sm:hidden">R</span>
            <Crosshair2Icon className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        )}
        <Button
          variant="outline"
          onClick={handleClearAllCache}
          disabled={isClearing}
          className="h-8 px-1 sm:px-2 lg:px-3 text-red-600 hover:text-red-700 text-xs sm:text-sm whitespace-nowrap"
        >
          <span className="hidden sm:inline">
            {isClearing ? 'Clearing...' : 'Clear All Cache'}
          </span>
          <span className="sm:hidden">
            {isClearing ? 'Clear...' : 'Clear'}
          </span>
          <TrashIcon className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      </div>
      {/* <DataTableViewOptions table={table} /> */}
    </div>
  );
}
