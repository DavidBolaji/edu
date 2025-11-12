import { Cookie } from '@/src/entities/models/cookie';
import { Session } from '@/src/entities/models/session';
import { allSignUpSchemaType } from '@/src/entities/models/auth/sign-up-schema';
import { AuthenticationError } from '@/src/entities/error/auth';
import { IAuthenticationService } from '../../services/auth.service.interface';
import { IUsersRepository } from '../../repositories/user.repository.interface';
import { ITransaction } from '@/src/entities/models/transaction';
import { IWalletRepository } from '../../repositories/wallet.repositoty.interface';

export type ISignUpUseCase = ReturnType<typeof signUpUseCase>;

export const signUpUseCase =
  (
    usersRepository: IUsersRepository,
    walletRepository: IWalletRepository,
    authenticationService: IAuthenticationService
  ) =>
  async (
    input: allSignUpSchemaType,
    tx?: ITransaction
  ): Promise<{
    session: Session;
    cookie: Cookie;
  }> => {
    const existingUser = await usersRepository.getUserByEmail(input.email);

    if (existingUser) {
      throw new AuthenticationError('Email taken');
    }

    const hashed_password = await authenticationService.generateHash(
      input.password
    );

    try {
      const newUser = await usersRepository.createUser({
        ...input,
        password: hashed_password
      }, tx);

      // Create wallet synchronously within the transaction for data consistency
      await walletRepository.createWallet(newUser.id, tx);

      const { cookie, session } = await authenticationService.createSession(
        newUser
      );


      return {
        cookie,
        session,
      };
    } catch (error) {
      throw error;
    }
  };
