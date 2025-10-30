import { DashboardBreadcrumb } from '@/app/dashboard/_components/bread-crumb';

import React, { PropsWithChildren } from 'react';
import { getCourseTitle } from '../../action';
import { getLevelName } from '../action';

const MediaLayout: React.FC<
  PropsWithChildren & { params: { courseId: string; levelId: string } }
> = async ({ children, params }) => {
  const req = await getCourseTitle({ courseId: params.courseId });
  const req2 = await getLevelName({ levelId: params.levelId });
  const isLevel = !!req2.level;

  const last = isLevel
    ? [
        {
          name: req2?.level?.name as string,
          url: `#`,
        },
      ]
    : [];

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
              url: isLevel ? `/dashboard/courses/${params.courseId}` : '#',
            },
            ...last,
          ]}
        />
      </div>
      {children}
    </>
  );
};

export default MediaLayout;
