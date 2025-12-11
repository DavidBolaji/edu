import { Main } from '@/app/dashboard/_components/main';
import React from 'react';

import { mediaListSchema } from './_data/schema';
import { getMedia } from './action';

import { columns } from './_components/table/media-columns';
import { MediaTable } from './_components/table/media-table';
import { MediasPrimaryButtons } from './_components/media-primary-buttons';
import { MediaDialogProvider } from './_context/media-dialog-context';
import { MediaDialogs } from './_components/media-dialogs';

export const revalidate = 0;

const MediaPage = async ({
  params,
}: {
  params: { courseId: string; levelId: string };
}) => {
  const req = await getMedia({
    courseId: params.courseId,
    levelId: params.levelId,
  });
  const mediaList = mediaListSchema.parse(req.media || []);
  return (
    <MediaDialogProvider>
      <Main>
        <div className="mb-2 flex flex-wrap items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Media List</h2>
            <p className="text-muted-foreground">Manage your media here.</p>
          </div>
          <MediasPrimaryButtons />
        </div>
        <div className="-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12">
          <MediaTable data={mediaList} columns={columns} />
        </div>
      </Main>
      <MediaDialogs />
    </MediaDialogProvider>
  );
};

export default MediaPage;
