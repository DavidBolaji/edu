import {
  getDetails,
  getSingleUser,
} from '@/app/dashboard/_services/user.services';
import React from 'react';
import { UserContextProvider } from './_context/user-context';
import { userMediaListSchema } from './_data/schema';
import { getUserMedia } from './action';
import { UserMediaTable } from './_components/table/user-media-table';
import { columns } from './_components/table/user-media-columns';
import MyImageAndSchool from '../../profile/_components/my-image-and-school';
import MyCounts from '../../profile/_components/my-counts';
import RenderButtons from '../_components/render-buttons';

interface ViewUserPageParams {
  params: { id: string };
}

export const revalidate = 0;

const ViewUserPage: React.FC<ViewUserPageParams> = async ({ params }) => {
  const userId = (await params)?.id;
  
  // Fetch all data in parallel to reduce loading time
  const [user, req, singleUserRequest] = await Promise.all([
    getDetails(),
    getUserMedia({ userId }),
    getSingleUser(userId).catch((error) => {
      console.error('Error fetching single user:', error);
      throw error;
    })
  ]);
  
  const singleUser = singleUserRequest;
  const mediaList = userMediaListSchema.parse(req.medias || []);

  return (
    <UserContextProvider>
      <div style={{ overflow: 'visible' }}>
        {/* User Profile Header */}
        <div className="mb-2 flex flex-wrap items-center justify-between space-y-2">
          <div className="w-full">
            <div className="bg-white rounded-lg p-6">
              <MyImageAndSchool user={singleUser} edit={false} />
              <MyCounts user={singleUser} />
              <RenderButtons
                tutorId={singleUser.id}
                subscriptions={user.subscriptions}
                join={{
                  isLive: req?.user?.isLive || false, 
                  code: req?.user?.code || null, 
                  userId: user.id, 
                  name: `${user.fname} ${user.lname}`
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Media Table - Same structure as library */}
        <div className="-mx-4 flex-1 px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12" style={{ overflow: 'visible' }}>
          <UserMediaTable data={mediaList} columns={columns} />
        </div>
      </div>
    </UserContextProvider>
  );
};

export default ViewUserPage;
