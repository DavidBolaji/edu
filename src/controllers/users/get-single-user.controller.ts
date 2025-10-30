import { IAuthenticationService } from '@/src/application/services/auth.service.interface';
import { IGetSingleUserUseCase } from '@/src/application/use-case/user/get-single-user-use-case';

import { UnauthenticatedError } from '@/src/entities/error/auth';
import { ReturnUserDetail } from '@/src/entities/models/user';
import { Media, User } from '@prisma/client';

export type IGetSingleUserController = ReturnType<
  typeof getSingleUserController
>;

function presenter(user: ReturnUserDetail | null, media: Media[]): any {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    fname: user.fname,
    lname: user.lname,
    picture: user.picture,
    role: user.role,
    school: user.school,
    media: media,
    _count: user._count,
  };
}

export const getSingleUserController =
  (
    getSingleUserUseCase: IGetSingleUserUseCase,
    authenticationService: IAuthenticationService
  ) =>
  async (
    requestId: string,
    sessionId: string | undefined
  ): Promise<ReturnType<typeof presenter>> => {
    try {
      if (!sessionId) {
        throw new UnauthenticatedError('Must be logged in to get requests');
      }

      await authenticationService.validateSession(sessionId);

      const { user, media } = await getSingleUserUseCase(requestId);

      return presenter(user, media);
    } catch (error) {
      throw error;
    }
  };
