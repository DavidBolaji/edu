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
  user: UserDetail;
  onUpdate: (portal: Portal) => void;
  onDelete: (portalId: string) => void;
  onRefresh: () => void;
}

export const PortalList: React.FC<PortalListProps> = ({ 
  portals, 
  loading, 
  user, 
  onUpdate, 
  onDelete, 
  onRefresh 
}) => {

  return (
    <PortalContextProvider 
      user={user} 
      onUpdate={onUpdate} 
      onDelete={onDelete} 
      onRefresh={onRefresh}
    >
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
