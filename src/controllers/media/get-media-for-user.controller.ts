import { IAuthenticationService } from '@/src/application/services/auth.service.interface';
import { IGetMediaForUserUseCase } from '@/src/application/use-case/media/get-media-for-user-use-case';
import { UnauthenticatedError } from '@/src/entities/error/auth';
import { Media } from '@prisma/client';
import _ from 'lodash';

export type IGetMediaForUserController = ReturnType<
  typeof getMediaForUserController
>;

function presenter(media: Media[]): any {
  return media;
}

export const getMediaForUserController =
  (
    authenticationService: IAuthenticationService,
    getMediaForUserUseCase: IGetMediaForUserUseCase
  ) =>
  async (
    sessionId: string | undefined
  ): Promise<ReturnType<typeof presenter>> => {
    try {
      if (!sessionId) {
        throw new UnauthenticatedError('Must be logged in to get details');
      }
      const { session } = await authenticationService.validateSession(
        sessionId
      );

      const { media } = await getMediaForUserUseCase(session.userId);
      return presenter(media);
    } catch (error) {
      throw new Error((error as Error).message);
    }
  };
