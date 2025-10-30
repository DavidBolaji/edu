import { ISubscribeRepository } from '../../repositories/subscribe.repository.interface';

export type ISubscribeToUserUseCase = ReturnType<typeof subscribeToUserUseCase>;

export const subscribeToUserUseCase =
  (subscribeRepository: ISubscribeRepository) =>
  async (authUser: string, userId: string): Promise<void> => {
    try {
      await subscribeRepository.subscribeToUser(authUser, userId);
    } catch (error) {
      throw error;
    }
  };
