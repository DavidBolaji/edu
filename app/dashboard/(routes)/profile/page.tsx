import React from 'react';
import ViewProfile from './_components/view-profile';
import { getDetails } from '../../_services/user.services';

const ProfilePage = async () => {
  const user = await getDetails();
  return (
    <div>
      <ViewProfile user={user} />
    </div>
  );
};

export default ProfilePage;
