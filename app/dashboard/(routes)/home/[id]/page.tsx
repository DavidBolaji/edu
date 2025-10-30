import {
  getDetails,
  getSingleUser,
} from '@/app/dashboard/_services/user.services';
import React from 'react';
import MyImageAndSchool from '../../profile/_components/my-image-and-school';
import MyCounts from '../../profile/_components/my-counts';
import RenderButtons from '../_components/render-buttons';
import { DashboardBreadcrumb } from '@/app/dashboard/_components/bread-crumb';
import { UserContextProvider } from './_context/user-context';
import { userMediaListSchema } from './_data/schema';
import { UserMediaTable } from './_components/table/user-media-table';
import { columns } from './_components/table/user-media-columns';
import { getUserMedia } from './action';

interface ViewUserPageParams {
  params: { id: string };
}

export const revalidate = 0;

const ViewUserPage: React.FC<ViewUserPageParams> = async ({ params }) => {
  let singleUser: any;
  const userId = (await params)?.id;
  const user = await getDetails();
  const req = await getUserMedia({ userId });
  const mediaList = userMediaListSchema.parse(req.medias || []);
  


  try {
    const request = await getSingleUser(userId);
    singleUser = request;
  } catch (error) {
    throw error;
  }

  return (
    <UserContextProvider>
      <div className="md:mx-4">
        <DashboardBreadcrumb
          paths={[
            {
              name: 'dashboard',
              url: '/dashboard/home',
            },
            {
              name: `${singleUser?.fname} ${singleUser?.lname}`,
              url: '#',
            },
          ]}
        />
      </div>
      <MyImageAndSchool user={singleUser} edit={false} />
      <MyCounts user={singleUser} />
      <RenderButtons
        tutorId={singleUser.id}
        subscriptions={user.subscriptions}
        join={{isLive: req?.user?.isLive || false, code: req?.user?.code || null, userId: user.id, name: `${user.fname} ${user.lname}`}}
       
      />
      <div className="-mx-4 mt-10 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12">
        <UserMediaTable data={mediaList} columns={columns} />
      </div>
    </UserContextProvider>
  );
};

export default ViewUserPage;
