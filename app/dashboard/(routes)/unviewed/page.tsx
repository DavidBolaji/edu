import React from 'react';
import { Main } from '../../_components/main';
import { getUnviewedMediaOnly } from '../../action';
import { userMediaListSchema } from '../home/[id]/_data/schema';
import { UserMediaTable } from '../home/[id]/_components/table/user-media-table';
import { columns } from '../home/[id]/_components/table/user-media-columns';
import { UnviewedBreadcrumb } from './_components/unviewed-breadcrumb';

const UnviewedPage = async () => {
  const req = await getUnviewedMediaOnly();
  const mediaList = userMediaListSchema.parse(req.media || []);
  return (
    <>
      <UnviewedBreadcrumb />
      <Main>
        <div className="mb-2 flex flex-wrap items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Unviewed List</h2>
            <p className="text-muted-foreground">
              Manage your Unviewed media here.
            </p>
          </div>
        </div>
        <div className="-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12">
          <UserMediaTable data={mediaList} columns={columns} />
        </div>
      </Main>
    </>
  );
};

export default UnviewedPage;
