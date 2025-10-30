'use server';

import db from '@/prisma';
import { getDetails, validate } from '../../_services/user.services';
import { Portal } from './types';
import { createServerAction } from 'zsa';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '@/config';

export const createPortal = async (data: any) => {
  const { desc, course, level, type, openDate, closeDate } = data;
  const userId = (await getDetails()).id;

  console.log('[GOT_HERE]');

  const portal = await db.portal.create({
    data: {
      desc,
      course,
      level,
      type,
      userId,
      openDate,
      closeDate,
    },
  });

  return portal;
};

export const updatePortalAction = createServerAction()
  .input(
    z.object({
      id: z.optional(z.string()),
      desc: z.string(),
      openDate: z.date(),
      closeDate: z.date(),
    })
  )
  .handler(async ({ input }) => {
    const sessionId = (await cookies()).get(SESSION_COOKIE)?.value;

    if (!sessionId) {
      throw new Error('User not authenticated');
    }

    const session = await validate(sessionId);

    try {
      if (!input.id) {
        return;
      } else {
        await db.portal.update({
          where: { id: input.id as string },
          data: {
            desc: input.desc as string,
            openDate: input.openDate,
            closeDate: input.closeDate
          },
        });
      }
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  });

export const getPortal = async () => {
  const portal = await db.portal.findMany({
    include: {
      _count: {
        select: {
          submissions: true
        }
      },
      submissions: {
        select: {
          id: true,
          url: true,
          userId: true,
          user: {
            select: {
              id: true,
              fname: true,
              lname: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return portal as unknown as Portal[];
};

export const getPortalById = async (id: string) => {
  const portal = await db.portal.findMany({
    where: {
      userId: id,
    },
    include: {
      submissions: {
        include: {
          user: {
            select: {
              id: true,
              fname: true,
              lname: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  return portal;
};

export const updatePortal = async (data: any) => {
  console.log('[PORTAL_UPDATE]', JSON.stringify(data, null, 2));

  await db.portal.update({
    where: {
      id: data.id,
    },
    data: {
      desc: data.desc,
      course: data.course,
      level: data.level,
      type: data.type,
      openDate: data.openDate,
      closeDate: data.closeDate,
    },
  });

  return;
};

export const deleteManyPortal = async (ids: string[]) => {
  console.log(ids);

  await db.portal.deleteMany({
    where: {
      id: {
        in: ids,
      },
    },
  });

  return;
};

export const addSubmission = async (
  { portalId,
    studentId,
    file }: any
) => {

  await db.submission.create({
    data: {
      portalId,
      userId: studentId,
      url: file
    }
  });

  return;
};

