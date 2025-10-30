import { DashboardBreadcrumb } from '@/app/dashboard/_components/bread-crumb';
import React from 'react';

export const UnviewedBreadcrumb = () => {
  return (
    <div className="md:mx-4">
      <DashboardBreadcrumb
        paths={[
          {
            name: 'dashboard',
            url: '/dashboard/home',
          },
          {
            name: 'unviewed',
            url: '#',
          },
        ]}
      />
    </div>
  );
};
