import { User } from '@prisma/client';
import { ITutorRepository } from '../../repositories/tutor.repository.interface';
import { IUsersRepository } from '../../repositories/user.repository.interface';
import { IGetTutorsParams } from '@/src/entities/models/tutor';

export type IGetTutorsForUserUseCase = ReturnType<
  typeof getTutorsForUserUseCase
>;

export const getTutorsForUserUseCase =
  (tutorRepository: ITutorRepository, userRepository: IUsersRepository) =>
  async (
    userId: string,
    params: IGetTutorsParams
  ): Promise<{ tutors: User[] }> => {
    try {
      const user = await userRepository.getUserDetails(userId);
      const tutors = await tutorRepository.getTutors(
        user?.school || '',
        userId,
        params
      );
      return { tutors };
    } catch (error) {
      throw error;
    }
  };
