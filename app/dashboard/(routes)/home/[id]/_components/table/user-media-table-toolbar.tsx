import { Table } from '@tanstack/react-table';
import { Input } from '@/app/_components/ui/input';
import useCourseTitle from '../../_hooks/use-course-title';
import { DataTableFacetedFilter } from '@/app/_components/table/data-table-faceted-filter';
import { Button } from '@/app/_components/ui/button';
import { Crosshair2Icon } from '@radix-ui/react-icons';
import useLevelName from '../../_hooks/use-level-name';

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

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2">
        <Input
          placeholder="Filter media by name..."
          value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('name')?.setFilterValue(event.target.value)
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
      {isFiltered && (
        <Button
          variant="ghost"
          onClick={() => table.resetColumnFilters()}
          className="h-8 px-2 lg:px-3"
        >
          Reset
          <Crosshair2Icon className="ml-2 h-4 w-4" />
        </Button>
      )}
      {/* <DataTableViewOptions table={table} /> */}
    </div>
  );
}
