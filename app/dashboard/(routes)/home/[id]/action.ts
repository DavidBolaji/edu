'use server';

import { getDetails, validate } from '@/app/dashboard/_services/user.services';
import { SESSION_COOKIE } from '@/config';
import db from '@/prisma';
import { cookies } from 'next/headers';

const PLAY_RATE_LIMIT_MINUTES = 15;

export const getUserMedia = async ({ userId }: { userId: string }) => {
  try {
    const req = db.user.findUnique({
      where: { id: userId },
      select: { code: true, isLive: true },
    });
    const req2 = db.media.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        size: true,
        format: true,
        url: true,
        type: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        course: {
          select: {
            title: true,
          },
        },
        level: {
          select: {
            name: true,
          },
        },
      },
    });

    const [user, medias] = await Promise.all([req, req2]);

    return { success: true, medias, user };
  } catch (error) {
    return { success: false };
  }
};
export const updateViewed = async ({ mediaId }: { mediaId: string }) => {
  const sessionId = (await cookies()).get(SESSION_COOKIE)?.value;

  if (!sessionId) {
    throw new Error('User not authenticated');
  }

  const session = await validate(sessionId);
  try {
    const media = await db.mediaView.findFirst({
      where: { AND: [{ mediaId }, { userId: session.userId }] },
    });
    if (!media) {
      await db.mediaView.create({
        data: {
          mediaId,
          userId: session.userId,
        },
      });
    }

    return { success: true };
  } catch (error) {
    return { success: false };
  }
};

export const handleDbPlay = async (data: {
  mediaId: string;
  educatorId: string;
  durationWatched?: number; // in seconds
  mediaDuration?: number; // in seconds
}) => {
  const { mediaId, educatorId, durationWatched, mediaDuration } = data;

  const user = await getDetails();
  const userId = user.id;

  // Prevent self-plays
  if (userId === educatorId || !educatorId) {
    console.log('[SKIP] User is educator, skipping play logging.');
    return null;
  }

  // Enforce rate limit: only 1 play per user per media every X minutes
  const rateLimitCutoff = new Date(
    Date.now() - PLAY_RATE_LIMIT_MINUTES * 60 * 1000
  );

  const recentPlay = await db.play.findFirst({
    where: {
      userId,
      mediaId,
      createdAt: { gte: rateLimitCutoff },
    },
  });

  if (recentPlay) {
    console.log('[SKIP] Rate limit active, skipping duplicate play.');
    return null;
  }

  // Optional: calculate ratio if both durations are provided
  let watchRatio: number | null = null;
  if (
    typeof durationWatched === 'number' &&
    typeof mediaDuration === 'number' &&
    mediaDuration > 0
  ) {
    watchRatio = durationWatched / mediaDuration;
  }

  const newPlay = await db.play.create({
    data: {
      userId,
      mediaId,
      educatorId,
      durationWatched: durationWatched ?? null,
      mediaDuration: mediaDuration ?? null,
      watchRatio,
    },
  });

  return newPlay;
};

export const getPlay = async () => {
  const play = await db.play.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
  return play;
};
