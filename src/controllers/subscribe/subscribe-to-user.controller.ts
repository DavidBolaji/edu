import { IAuthenticationService } from '@/src/application/services/auth.service.interface';
import { ISubscribeToUserUseCase } from '@/src/application/use-case/subscribe/subscribe-to-user-use-case';
import { UnauthenticatedError } from '@/src/entities/error/auth';

export type ISubscribeToUserController = ReturnType<
  typeof subscribeToUserController
>;

export const subscribeToUserController =
  (
    authenticationService: IAuthenticationService,
    subscribeToUserUseCase: ISubscribeToUserUseCase
  ) =>
  async (sessionId: string | undefined, userId: string): Promise<void> => {
    try {
      if (!sessionId) {
        throw new UnauthenticatedError('Must be logged in to get details');
      }
      const { session } = await authenticationService.validateSession(
        sessionId
      );

      await subscribeToUserUseCase(session.userId, userId);
    } catch (error) {
      throw new Error((error as Error).message);
    }
  };
