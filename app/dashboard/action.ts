'use server';

import { SESSION_COOKIE } from '@/config';
import { getInjection } from '@/di/container';
import db from '@/prisma';
import { Cookie } from '@/src/entities/models/cookie';
import { Media, MediaType } from '@prisma/client';
import { unstable_noStore } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { validate } from './_services/user.services';
import _ from 'lodash';
import { UserMedia } from './(routes)/home/[id]/_data/schema';
import { notifyRecipients } from '../_lib/push';

function presenter(media: Media[]): Record<string, number> {
  const expectedTypes: MediaType[] = ['AUDIO', 'VIDEO', 'EBOOK'];
  const groupedMedia = _.groupBy(media, 'type');

  const mediaCount: Record<string, number> = {};

  for (const type of expectedTypes) {
    mediaCount[type] = groupedMedia[type]?.length || 0;
  }

  return mediaCount;
}

export async function signOut() {
  const sessionId = (await cookies()).get(SESSION_COOKIE)?.value;

  let blankCookie: Cookie;
  try {
    const signOutController = getInjection('ISignOutController');
    blankCookie = await signOutController(sessionId);
  } catch (err) {
    return {
      success: false,
      error: (err as Error).message,
    };
  }

  (await cookies()).set(
    blankCookie.name,
    blankCookie.value,
    blankCookie.attributes
  );

  return redirect('/sign-in');
}

export const handleSearch = (formData: FormData) => {
  const search = formData.get('search') as string;
  const params = new URLSearchParams();

  // Handle pagination and sorting
  if (search) {
    params.set('search', search);
  } else {
    params.delete('search');
  }

  const newQuery = params.toString();
  if (newQuery) {
    const redirectPath = `/dashboard/home?${newQuery}`;
    redirect(redirectPath);
  } else {
    // Redirect to the base path if no parameters exist
    const redirectPath = '/dashboard/home';
    redirect(redirectPath);
  }
};

export async function getUnviewedMedia(): Promise<Record<string, number>> {
  const sessionId = (await cookies()).get(SESSION_COOKIE)?.value;

  if (!sessionId) {
    throw new Error('User not authenticated');
  }

  const session = await validate(sessionId);

  try {
    const unviewedMedia = await db.media.findMany({
      where: {
        user: {
          subscriptions: {
            some: {
              subscriberId: session.userId,
            },
          },
        },
        viewedBy: {
          none: {
            userId: session.userId,
          },
        },
      },
    });

    return presenter(unviewedMedia);
  } catch (error) {
    throw error;
  }
}

export async function getUnviewedMediaOnly(): Promise<{
  success: boolean;
  media: UserMedia[];
}> {
  const sessionId = (await cookies()).get(SESSION_COOKIE)?.value;

  if (!sessionId) {
    throw new Error('User not authenticated');
  }

  const session = await validate(sessionId);

  try {
    const unviewedMedia = await db.media.findMany({
      where: {
        user: {
          subscriptions: {
            some: {
              subscriberId: session.userId,
            },
          },
        },
        viewedBy: {
          none: {
            userId: session.userId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        size: true,
        format: true,
        url: true,
        type: true,
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

    return { success: true, media: unviewedMedia };
  } catch (error) {
    throw error;
  }
}

export const handleTest = async (user: any) => {
  const payload = {
    title: 'New quiz portal added',
    body: `${user.fname} ${user.lname} created push`,
    url: `/dashboard/portal/${user.id}`,
  };
  console.log(payload)
  await notifyRecipients({ type: "followersOf", ids: [user.id] }, payload)
}

export const reload = (path: string) => {
  unstable_noStore();
  redirect(path);
};
