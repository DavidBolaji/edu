import { Media } from '@prisma/client';
import { IMediaRepository } from '../../repositories/media.repository.interface';

export type IGetMediaForUserUseCase = ReturnType<typeof getMediaForUserUseCase>;

export const getMediaForUserUseCase =
  (mediaRepository: IMediaRepository) =>
  async (userId: string): Promise<{ media: Media[] }> => {
    try {
      const media = await mediaRepository.getMediaDetails(userId);
      return { media };
    } catch (error) {
      throw error;
    }
  };
