import { DashboardBreadcrumb } from '@/app/dashboard/_components/bread-crumb';

import React from 'react';
import { getCourseTitle } from '../../action';

const CoursePageBreadcrumb: React.FC<{
  params: { courseId: string };
}> = async ({ params }) => {
  const req = await getCourseTitle({ courseId: params.courseId });

  return (
    <>
      <div className="md:mx-4">
        <DashboardBreadcrumb
          paths={[
            {
              name: 'dashboard',
              url: '/dashboard/home',
            },
            {
              name: 'courses',
              url: '/dashboard/courses',
            },
            {
              name: req?.course?.title as string,
              url: '#',
            },
          ]}
        />
      </div>
    </>
  );
};

export default CoursePageBreadcrumb;
