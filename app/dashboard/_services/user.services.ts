'use server';

import { SESSION_COOKIE } from '@/config';
import { getInjection } from '@/di/container';
import {
  AuthenticationError,
  UnauthenticatedError,
} from '@/src/entities/error/auth';
import { unstable_noStore } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function getDetails() {
  const sessionId = (await cookies()).get(SESSION_COOKIE)?.value;
  try {
    const getDetailsForUserController = getInjection(
      'IGetDetailsForUserController'
    );
    return await getDetailsForUserController(sessionId);
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

export async function validate(sessionId: string | undefined) {
  if (!sessionId) {
    return redirect('/sign-in');
  }

  try {
    const authenticationService = getInjection('IAuthenticationService');
    const { session } = await authenticationService.validateSession(sessionId);
    return session;
  } catch (err) {
    return redirect('/sign-in');
  }
}

export async function getSingleUser(id: string) {
  unstable_noStore(); // Opt out of static rendering
  const sessionId = (await cookies()).get(SESSION_COOKIE)?.value;
  try {
    const getSingleUserController = getInjection('IGetSingleUserController');
    return await getSingleUserController(id, sessionId);
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
