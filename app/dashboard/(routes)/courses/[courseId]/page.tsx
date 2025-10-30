import { Main } from '@/app/dashboard/_components/main';
import React from 'react';
import { LevelsContextProvider } from './_context/level-context';
import { levelListSchema } from './_data/schema';
import { getLevels } from './action';
import { LevelsPrimaryButtons } from './_components/levels-primary-buttons';
import { LevelDialogs } from './_components/level-dialogs';
import { LevelTable } from './_components/table/level-table';
import { columns } from './_components/table/level-columns';
import CoursePageBreadcrumb from './_components/course-page-breadcrumb';

export const revalidate = 0;

const SingleCoursesPage = async ({
  params,
}: {
  params: { courseId: string };
}) => {
  const req = await getLevels({ courseId: params.courseId });
  const levelList = levelListSchema.parse(req.levels || []);
  return (
    <LevelsContextProvider>
      <CoursePageBreadcrumb params={params} />
      <Main>
        <div className="mb-2 flex flex-wrap items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Level List</h2>
            <p className="text-muted-foreground">Manage your levels here.</p>
          </div>
          <LevelsPrimaryButtons />
        </div>
        <div className="-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12">
          <LevelTable data={levelList} columns={columns} />
        </div>
      </Main>
      <LevelDialogs />
    </LevelsContextProvider>
  );
};

export default SingleCoursesPage;
