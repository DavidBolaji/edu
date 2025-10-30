import { IAuthenticationService } from '@/src/application/services/auth.service.interface';
import { IGetMediaUnviewedForUserUseCase } from '@/src/application/use-case/media/get-media-unviewed-for-user-use-case';
import { UnauthenticatedError } from '@/src/entities/error/auth';
import { Media, MediaType } from '@prisma/client';
import _ from 'lodash';

export type IGetMediaUnviewedForUserController = ReturnType<
  typeof getMediaUnviewedForUserController
>;

function presenter(media: Media[]): Record<string, number> {
  const expectedTypes: MediaType[] = ['AUDIO', 'VIDEO', 'EBOOK'];
  const groupedMedia = _.groupBy(media, 'type');

  const mediaCount: Record<string, number> = {};

  for (const type of expectedTypes) {
    mediaCount[type] = groupedMedia[type]?.length || 0;
  }

  return mediaCount;
}

export const getMediaUnviewedForUserController =
  (
    authenticationService: IAuthenticationService,
    getMediaUnviewedForUserUseCase: IGetMediaUnviewedForUserUseCase
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

      const { unviewedMedia } = await getMediaUnviewedForUserUseCase(
        session.userId
      );
      return presenter(unviewedMedia);
    } catch (error) {
      throw new Error((error as Error).message);
    }
  };
