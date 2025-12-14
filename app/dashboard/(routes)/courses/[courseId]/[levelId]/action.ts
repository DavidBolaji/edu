'use server';

import { validate } from '@/app/dashboard/_services/user.services';
import { SESSION_COOKIE } from '@/config';
import db from '@/prisma';
import { MediaType } from '@prisma/client';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { createServerAction } from 'zsa';

export const createMedia = createServerAction()
  .input(
    z.object({
      id: z.optional(z.string()),
      name: z.string(),
      courseId: z.string(),
      levelId: z.string(),
      size: z.number(),
      format: z.string(),
      url: z.string(),
      type: z.string(),
    })
  )
  .handler(async ({ input }) => {
    const sessionId = (await cookies()).get(SESSION_COOKIE)?.value;

    if (!sessionId) {
      throw new Error('User not authenticated');
    }

    const { userId } = await validate(sessionId);

    try {
      if (!input.id) {
        await db.media.create({
          data: {
            name: input.name,
            userId,
            size: input.size,
            format: input.format,
            url: input.url,
            type: input.type as MediaType,
            courseId: input.courseId,
            levelId: input.levelId,
          },
        });
      } else {
        await db.media.update({
          where: { id: input.id },
          data: {
            name: input.name,
            size: input.size,
            format: input.format,
            url: input.url,
            type: input.type as MediaType,
          },
        });
      }
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  });

export const getMedia = async ({
  courseId,
  levelId,
}: {
  courseId: string;
  levelId: string;
}) => {
  try {
    const sessionId = (await cookies()).get(SESSION_COOKIE)?.value;

    if (!sessionId) {
      throw new Error('User not authenticated');
    }

    const session = await validate(sessionId);
    const media = await db.media.findMany({
      where: {
        AND: [
          {
            courseId,
          },
          {
            levelId,
          },
          {
            userId: session.userId,
          },
        ],
      },
    });



    return { success: true, media };
  } catch (error) {
    return { success: false };
  }
};

export const deleteMedia = createServerAction()
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

    const { userId } = await validate(sessionId);

    try {
      // Delete the media (ensure user owns it)
      await db.media.delete({
        where: { 
          id: input.id,
          userId: userId // Ensure user owns the media
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Delete media error:', error);
      return { success: false, error: 'Failed to delete media' };
    }
  });
