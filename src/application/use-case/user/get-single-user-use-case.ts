import { Media, User } from '@prisma/client';
import { IUsersRepository } from '../../repositories/user.repository.interface';
import { IMediaRepository } from '../../repositories/media.repository.interface';
import { ReturnUserDetail } from '@/src/entities/models/user';

export type IGetSingleUserUseCase = ReturnType<typeof getSingleUserUseCase>;

export const getSingleUserUseCase =
  (userRepository: IUsersRepository, mediaRepository: IMediaRepository) =>
  async (
    userId: string
  ): Promise<{ user: ReturnUserDetail; media: Media[] }> => {
    try {
      const user = (await userRepository.getUserDetails(
        userId
      )) as ReturnUserDetail;
      const media = (await mediaRepository.getMediaDetails(userId)) as Media[];

      return { user, media };
    } catch (error) {
      throw error;
    }
  };
