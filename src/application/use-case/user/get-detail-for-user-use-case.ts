import { User, Wallet } from '@prisma/client';
import { IUsersRepository } from '../../repositories/user.repository.interface';
import { IWalletRepository } from '../../repositories/wallet.repositoty.interface';
import { ReturnUserDetail } from '@/src/entities/models/user';

export type IGetDetailForUserUseCase = ReturnType<
  typeof getDetailForUserUseCase
>;

export const getDetailForUserUseCase =
  (userRepository: IUsersRepository, walletRepository: IWalletRepository) =>
  async (
    userId: string
  ): Promise<{ user: ReturnUserDetail; wallet: Wallet }> => {
    try {
      const user = (await userRepository.getUserDetails(
        userId
      )) as ReturnUserDetail;
      const wallet = (await walletRepository.getWalletDetails(
        userId
      )) as Wallet;

      return { user, wallet };
    } catch (error) {
      throw error;
    }
  };
