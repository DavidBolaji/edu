import { SESSION_COOKIE } from '@/config';
import { getInjection } from '@/di/container';
import {
  AuthenticationError,
  UnauthenticatedError,
} from '@/src/entities/error/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function getMedia() {
  const sessionId = (await cookies()).get(SESSION_COOKIE)?.value;
  try {
    const getMediaForUserController = getInjection(
      'IGetMediaForUserController'
    );
    return await getMediaForUserController(sessionId);
  } catch (error) {
    if (
      error instanceof UnauthenticatedError ||
      error instanceof AuthenticationError
    ) {
      redirect('/sign-in');
    }
    throw error;
  }
}

export async function getMediaUnviewed() {
  const sessionId = (await cookies()).get(SESSION_COOKIE)?.value;
  try {
    const getMediaUnviewedForUserController = getInjection(
      'IGetMediaUnviewedForUserController'
    );
    return await getMediaUnviewedForUserController(sessionId);
  } catch (error) {
    if (
      error instanceof UnauthenticatedError ||
      error instanceof AuthenticationError
    ) {
      redirect('/sign-in');
    }
    throw error;
  }
}
