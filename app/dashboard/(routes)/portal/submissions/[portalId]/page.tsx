import { getDetails } from '@/app/dashboard/_services/user.services';
import React from 'react';

import ViewSubmissions from './_components/view-submissions';
import { getPortalSubmissions } from '../action';
import { Submission } from '../../types';

interface SubmissionsPageParams {
  params: { portalId: string };
}

export const revalidate = 0;

const SingleSubmissionPage: React.FC<SubmissionsPageParams> = async ({
  params,
}) => {
  const id = (await params).portalId;
  const user = await getDetails();
  const req = await getPortalSubmissions(id) as unknown as  {submissions: Submission[], portal: {course: string}};
  return <ViewSubmissions submissions={req.submissions} portal={req.portal} />;
};

export default SingleSubmissionPage;