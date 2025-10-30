import { User } from '@prisma/client';
import React from 'react';

const MyCounts: React.FC<{ user: any }> = ({ user }) => {
  return (
    user?.role === 'LECTURER' && (
      <div className="flex justify-center gap-3 mt-4 mb-8">
        <div className="items-center">
          <h2 className="text-lg font-bold text-center">
            {user?._count.courses}
          </h2>
          <h2 className="text-sm text-gray-700">Courses</h2>
        </div>
        <div className="items-center text-center">
          <h2 className="text-lg font-bold">{user?._count.subscriptions}</h2>
          <h2 className="text-sm text-gray-700">Subscriber(s)</h2>
        </div>
      </div>
    )
  );
};

export default MyCounts;
