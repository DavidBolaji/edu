import { getDetails } from '@/app/dashboard/_services/user.services';
import React from 'react';
import { getPortal } from '../action';
import ViewUserPortal from './_components/view-user-portal';
import { Portal } from '../_components/table/schema';

interface SinglePortalPageParams {
  params: { id: string };
}

export const revalidate = 0;

const SinglePortalPage: React.FC<SinglePortalPageParams> = async ({
  params,
}) => {
  const id = (await params).id;
  const user = await getDetails();
  const portals = await getPortal() as unknown as  Portal[];
  return <ViewUserPortal portal={portals} studentId={user.id} />;
};

export default SinglePortalPage;
