import React from 'react';
import { WalletCard } from '../../_components/wallet/wallet';
import { getDetails } from '../../_services/user.services';

import { getTutors } from '../../_services/tutors.services';
import RenderTutors from './_components/render-tutors';
import RenderMedia from './_components/render-media';
import Search from './_components/search';
import { getUnviewedMedia } from '../../action';

export const revalidate = 0;

interface HomePageSearchParams {
  [key: string]: string;
}

const HomePage: React.FC<{ searchParams: HomePageSearchParams }> = async ({
  searchParams,
}) => {
  const search = searchParams.search || '';
  const user = await getDetails();
  const media = await getUnviewedMedia();
  const tutors = await getTutors({ search });

  return (
    <div>
      <WalletCard user={user} amount={user?.wallet?.amount || 0} />
      <div className="mt-10" />
      <RenderMedia media={media} />
      <div className="mt-10" />
      <h2 className="text-4xl font-bold font-space-mono">
        Educators you may know!
      </h2>
      <div className="mt-5" />
      <Search />
      <div className="mt-6" />
      <RenderTutors tutors={tutors} subscriptions={user.subscriptions} />
    </div>
  );
};

export default HomePage;
