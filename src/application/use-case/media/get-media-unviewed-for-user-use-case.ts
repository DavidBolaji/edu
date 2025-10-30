import { Media } from '@prisma/client';
import { IMediaRepository } from '../../repositories/media.repository.interface';

export type IGetMediaUnviewedForUserUseCase = ReturnType<
  typeof getMediaUnviewedForUserUseCase
>;

export const getMediaUnviewedForUserUseCase =
  (mediaRepository: IMediaRepository) =>
  async (userId: string): Promise<{ unviewedMedia: Media[] }> => {
    try {
      const unviewedMedia = await mediaRepository.getUnviewedMedia(userId);
      return { unviewedMedia };
    } catch (error) {
      throw error;
    }
  };
