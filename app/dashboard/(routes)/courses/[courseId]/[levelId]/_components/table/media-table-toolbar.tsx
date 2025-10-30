import { Table } from '@tanstack/react-table';
import { Input } from '@/app/_components/ui/input';
import { DataTableFacetedFilter } from '@/app/_components/table/data-table-faceted-filter';
import { Button } from '@/app/_components/ui/button';
import { Cross2Icon } from '@radix-ui/react-icons';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2">
        <Input
          placeholder="Filter media..."
          value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('name')?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
      </div>
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
      </div>
      {isFiltered && (
        <Button
          variant="ghost"
          onClick={() => table.resetColumnFilters()}
          className="h-8 px-2 lg:px-3"
        >
          Reset
          <Cross2Icon className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
