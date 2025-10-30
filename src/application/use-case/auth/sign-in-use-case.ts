import { Cookie } from '@/src/entities/models/cookie';
import { Session } from '@/src/entities/models/session';
import { IUsersRepository } from '../../repositories/user.repository.interface';
import { IAuthenticationService } from '../../services/auth.service.interface';
import { signInSchemaType } from '@/src/entities/models/auth/login-schema';
import { AuthenticationError } from '@/src/entities/error/auth';

export type ISignInUseCase = ReturnType<typeof signInUseCase>;

export const signInUseCase =
  (
    usersRepository: IUsersRepository,
    authenticationService: IAuthenticationService
  ) =>
  async (
    input: signInSchemaType
  ): Promise<{ session: Session; cookie: Cookie }> => {
    try {
      const existingUser = await usersRepository.getUserByEmail(input.email);

      if (!existingUser) {
        throw new AuthenticationError('User does not exist');
      }

      const validPassword = await authenticationService.validatePasswords(
        input.password,
        existingUser.password
      );

      if (!validPassword) {
        throw new AuthenticationError('Incorrect username or password');
      }

      const { session, cookie } = await authenticationService.createSession(
        existingUser
      );

      return { session, cookie };
    } catch (error) {
      throw error;
    }
  };
