import React from 'react';
import { Portal } from './table/schema';

import { PortalTable } from './table/portal-table';
import { columns } from './table/portal-columns';
import { PortalContextProvider } from '../_context/portal-context';
import { PortalsDialogs } from './portal-dialogs';
import { UserDetail } from '@/src/entities/models/user';

interface PortalListProps {
  portals: Portal[];
  loading: boolean;
  user: UserDetail
}

export const PortalList: React.FC<PortalListProps> = ({ portals, loading, user }) => {

  return (
    <PortalContextProvider user={user}>
      <h2 className="text-xl font-bold mt-4 mb-2">Your Portals</h2>
      {loading ? (
        <div>Loading...</div>
      ) : (
       <PortalTable data={portals} columns={columns}  />
      )}
      <PortalsDialogs />
    </PortalContextProvider>
  );
};
