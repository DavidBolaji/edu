'use server';

import db from '@/prisma';
import { getDetails, validate } from '../../_services/user.services';
import { Portal } from './types';
import { createServerAction } from 'zsa';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '@/config';
import { notifyRecipients } from '@/app/_lib/push';


export const createPortal = async (data: any) => {
  const { desc, course, level, type, openDate, closeDate } = data;
  const user = (await getDetails());

  const payload = {
    title: 'New quiz portal added',
    body: `${user.fname} ${user.lname} created quiz for ${course}`,
    url: `/dashboard/portal/${user.id}`,
  };

  const payload2 = {
    title: 'New quiz portal added',
    body: `You created quiz for ${course}`,
    url: `/dashboard/portal/${user.id}`,
  };

  const portal = await db.portal.create({
    data: {
      desc,
      course,
      level,
      type,
      userId: user.id,
      openDate,
      closeDate,
    },
  });

  await Promise.all([notifyRecipients({ type: 'followersOf', ids: [user.id] }, payload),
  notifyRecipients({ type: "self", ids: [user.id] }, payload2)])

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

    await validate(sessionId);

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

export const upsertSubmission = async (
  { portalId,
    studentId,
    file }: any
) => {
  // Check if submission already exists
  const existingSubmission = await db.submission.findFirst({
    where: {
      portalId,
      userId: studentId
    }
  });

  if (existingSubmission) {
    // Update existing submission
    await db.submission.update({
      where: {
        id: existingSubmission.id
      },
      data: {
        url: file,
        updatedAt: new Date()
      }
    });
  } else {
    // Create new submission
    await db.submission.create({
      data: {
        portalId,
        userId: studentId,
        url: file
      }
    });
  }

  return;
};

export const deletePortal = createServerAction()
  .input(
    z.object({
      id: z.string(),
    })
  )
  .handler(async ({ input }) => {
    const sessionId = (await cookies()).get(SESSION_COOKIE)?.value;

    if (!sessionId) {
      throw new Error('User not authenticated');
    }

    const session = await validate(sessionId);

    try {
      // First delete all related submissions
      await db.submission.deleteMany({
        where: { portalId: input.id },
      });

      // Then delete the portal (ensure user owns it)
      await db.portal.delete({
        where: { 
          id: input.id,
          userId: session.userId // Ensure user owns the portal
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Delete portal error:', error);
      return { success: false, error: 'Failed to delete portal' };
    }
  });

