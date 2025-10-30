'use server';

import db from '@/prisma';
import { getDetails } from '../../_services/user.services';

export const createOffline = async (data: any) => {
  const userId = (await getDetails()).id;
  const { mediaId, educatorId } = data;

  console.log('[GOT_HERE]');

  const offline = await db.offlineDownload.create({
    data: {
      userId,
      mediaId,
      educatorId,
    },
  });

  return offline;
};

export const getOffline = async () => {
  const offline = await db.offlineDownload.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
  return offline;
};
