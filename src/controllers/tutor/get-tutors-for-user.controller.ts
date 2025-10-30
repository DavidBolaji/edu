import { IAuthenticationService } from '@/src/application/services/auth.service.interface';
import { IGetTutorsForUserUseCase } from '@/src/application/use-case/tutor/get-tutors-for-user-use-case';

import { UnauthenticatedError } from '@/src/entities/error/auth';
import { IGetTutorsParams } from '@/src/entities/models/tutor';
import { User } from '@prisma/client';

export type IGetTutorsForUserController = ReturnType<
  typeof getTutorsForUserController
>;

function presenter(tutors: User[]): any {
  return tutors.map((tutor) => ({
    id: tutor.id,
    fname: tutor.fname,
    lname: tutor.lname,
    picture: tutor.picture,
  }));
}

export const getTutorsForUserController =
  (
    authenticationService: IAuthenticationService,
    getTutorsForUserUseCase: IGetTutorsForUserUseCase
  ) =>
  async (
    sessionId: string | undefined,
    params: IGetTutorsParams
  ): Promise<ReturnType<typeof presenter>> => {
    try {
      if (!sessionId) {
        throw new UnauthenticatedError('Must be logged in to get details');
      }
      const { session } = await authenticationService.validateSession(
        sessionId
      );

      const { tutors } = await getTutorsForUserUseCase(session.userId, params);
      return presenter(tutors);
    } catch (error) {
      throw new Error((error as Error).message);
    }
  };
