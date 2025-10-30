import { SESSION_COOKIE } from '@/config';
import { getInjection } from '@/di/container';
import {
  AuthenticationError,
  UnauthenticatedError,
} from '@/src/entities/error/auth';
import { IGetTutorsParams } from '@/src/entities/models/tutor';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function getTutors({ search }: IGetTutorsParams) {
  const sessionId = (await cookies()).get(SESSION_COOKIE)?.value;
  try {
    const getTutorsForUserController = getInjection(
      'IGetTutorsForUserController'
    );
    return await getTutorsForUserController(sessionId, { search });
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
