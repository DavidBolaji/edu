import React from 'react';
import { courseListSchema } from './_data/schema';
import { CourseContextProvider } from './_context/courses-context';
import { Main } from '../../_components/main';
import { CoursesPrimaryButtons } from './_components/courses-primary-buttons';
import { CoursesDialogs } from './_components/course-dialogs';
import { CourseTable } from './_components/table/course-table';
import { getCourses } from './action';
import { columns } from './_components/table/course-columns';

export const revalidate = 0;

const CoursesPage = async () => {
  const req = await getCourses();
  const courseList = courseListSchema.parse(req.courses || []);
  return (
    <CourseContextProvider>
      <Main>
        <div className="mb-2 flex flex-wrap items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Courses List</h2>
            <p className="text-muted-foreground">Manage your courses here.</p>
          </div>
          <CoursesPrimaryButtons />
        </div>
        <div className="-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12">
          <CourseTable data={courseList} columns={columns} />
        </div>
      </Main>
      <CoursesDialogs />
    </CourseContextProvider>
  );
};

export default CoursesPage;
