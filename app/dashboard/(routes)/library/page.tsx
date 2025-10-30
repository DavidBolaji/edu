import React from 'react';
import { OfflineContextProvider } from './_context/offline-context';
import { Main } from '../../_components/main';
import { columns } from './_components/table/library-columns';
import { LibraryMediaTable } from './_components/table/library-table';
import { OfflineViewerModal } from './_components/offline-media-modal';

export const revalidate = 0;

const CoursesPage = async () => {
  return (
    <OfflineContextProvider>
      <Main>
        <div className="mb-2 flex flex-wrap items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Library</h2>
            <p className="text-muted-foreground">Manage your library here.</p>
          </div>
        </div>
        <div className="-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12">
          <LibraryMediaTable columns={columns} />
        </div>
      </Main>
      <OfflineViewerModal />
    </OfflineContextProvider>
  );
};

export default CoursesPage;
