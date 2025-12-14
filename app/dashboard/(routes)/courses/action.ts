'use server';

import { SESSION_COOKIE } from '@/config';
import db from '@/prisma';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { createServerAction } from 'zsa';
import { validate } from '../../_services/user.services';

export const createCourse = createServerAction()
  .input(
    z.object({
      id: z.optional(z.string()),
      title: z.string(),
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
        await db.course.create({
          data: {
            userId: session.userId,
            title: input.title,
          },
        });
      } else {
        await db.course.update({
          where: { id: input.id },
          data: {
            title: input.title,
          },
        });
      }
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  });

export const getCourses = async () => {
  try {
    const sessionId = (await cookies()).get(SESSION_COOKIE)?.value;

    if (!sessionId) {
      throw new Error('User not authenticated');
    }

    const session = await validate(sessionId);
    const courses = await db.course.findMany({
      where: { userId: session.userId },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            medias: true,
            levels: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, courses };
  } catch (error) {
    return { success: false };
  }
};

export const getCourseTitle = async ({ courseId }: { courseId: string }) => {
  try {
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { title: true },
    });

    return { success: true, course };
  } catch (error) {
    return { success: false };
  }
};

export const getCoursesTitle = async ({ userId }: { userId: string }) => {
  try {
    const course = await db.course.findMany({
      where: { userId },
      select: { title: true },
    });

    return { success: true, course };
  } catch (error) {
    return { success: false };
  }
};

export const deleteCourse = createServerAction()
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
      // First delete all related media and levels
      await db.media.deleteMany({
        where: { courseId: input.id },
      });
      
      await db.level.deleteMany({
        where: { courseId: input.id },
      });

      // Then delete the course
      await db.course.delete({
        where: { 
          id: input.id,
          userId: session.userId // Ensure user owns the course
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Delete course error:', error);
      return { success: false, error: 'Failed to delete course' };
    }
  });
