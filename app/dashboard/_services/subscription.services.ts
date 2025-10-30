'use server';

import { SESSION_COOKIE } from '@/config';
import { getInjection } from '@/di/container';
import {
  AuthenticationError,
  UnauthenticatedError,
} from '@/src/entities/error/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function subscribeOrUnsubscribe(tutorId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const sessionId = (await cookies()).get(SESSION_COOKIE)?.value;
  try {
    const subscribeToUserController = getInjection(
      'ISubscribeToUserController'
    );
    await subscribeToUserController(sessionId, tutorId);
    return { success: true };
  } catch (error) {
    if (
      error instanceof UnauthenticatedError ||
      error instanceof AuthenticationError
    ) {
      redirect('/sign-in');
    }
    return {
      success: false,
      error: 'Something went wrong',
    };
  }
}
