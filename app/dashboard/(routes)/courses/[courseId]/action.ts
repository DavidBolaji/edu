'use server';

import { validate } from '@/app/dashboard/_services/user.services';
import { SESSION_COOKIE } from '@/config';
import db from '@/prisma';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { createServerAction } from 'zsa';

export const createLevel = createServerAction()
  .input(
    z.object({
      id: z.optional(z.string()),
      name: z.string(),
      courseId: z.string(),
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
        await db.level.create({
          data: {
            name: input.name,
            courseId: input.courseId,
          },
        });
      } else {
        await db.level.update({
          where: { id: input.id },
          data: {
            name: input.name,
          },
        });
      }
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  });

export const getLevels = async ({ courseId }: { courseId: string }) => {
  try {
    const levels = await db.level.findMany({
      where: { courseId },
      select: { id: true, name: true, createdAt: true, updatedAt: true },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, levels };
  } catch (error) {
    return { success: false };
  }
};

export const getLevelName = async ({ levelId }: { levelId: string }) => {
  try {
    const level = await db.level.findUnique({
      where: { id: levelId },
      select: { name: true },
    });

    return { success: true, level: level ?? null };
  } catch (error) {
    return { success: false };
  }
};

export const getLevelsName = async ({ userId }: { userId: string }) => {
  try {
    const user = await db.user.findMany({
      where: { id: userId },
      select: {
        courses: {
          select: {
            levels: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const levelNamesSet = new Set<string>();

    // Extract level names from nested structure
    user.forEach((u) => {
      u.courses.forEach((course) => {
        course.levels.forEach((level) => {
          levelNamesSet.add(level.name);
        });
      });
    });

    const uniqueLevelNames = Array.from(levelNamesSet);

    return { success: true, name: uniqueLevelNames };
  } catch (error) {
    return { success: false };
  }
};

export const deleteLevel = createServerAction()
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

    await validate(sessionId);

    try {
      // First delete all related media
      await db.media.deleteMany({
        where: { levelId: input.id },
      });

      // Then delete the level
      await db.level.delete({
        where: { id: input.id },
      });

      return { success: true };
    } catch (error) {
      console.error('Delete level error:', error);
      return { success: false, error: 'Failed to delete level' };
    }
  });
