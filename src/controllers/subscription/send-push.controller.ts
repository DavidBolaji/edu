import { IAuthenticationService } from '@/src/application/services/auth.service.interface';
import { ISendPushUseCase } from '@/src/application/use-case/subscription/send-push-use-case';

import { UnauthenticatedError } from '@/src/entities/error/auth';

export type ISendPushController = ReturnType<typeof sendPushController>;

export const sendPushController =
  (
    sendPushUseCase: ISendPushUseCase,
    authenticationService: IAuthenticationService
  ) =>
  async (
    userId: string | undefined,
    message: string,
    name: string,
    url: string,
    sessionId: string | undefined
  ) => {
    try {
      if (!userId) {
        if (!sessionId) {
          throw new UnauthenticatedError(
            'Session ID is required when user ID is not provided'
          );
        }

        const { session } = await authenticationService.validateSession(
          sessionId
        );
        return await sendPushUseCase(session.userId, message, name, url);
      }

      return await sendPushUseCase(userId, message, name, url);
    } catch (error) {
      throw error;
    }
  };
