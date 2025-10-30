import { IAuthenticationService } from '@/src/application/services/auth.service.interface';
import { ISubscribeToPushNotificationUseCase } from '@/src/application/use-case/subscription/subscribe-to-push-notification-use-case';

import { UnauthenticatedError } from '@/src/entities/error/auth';

export type ISubscribeToPushNotificationController = ReturnType<
  typeof subscribeToPushNotificationController
>;

export const subscribeToPushNotificationController =
  (
    subscribeToPushNotificationUseCase: ISubscribeToPushNotificationUseCase,
    authenticationService: IAuthenticationService
  ) =>
  async (input: {
    subscription: PushSubscription;
    sessionId: string | undefined;
  }): Promise<boolean> => {
    try {
      if (!input.sessionId) {
        throw new UnauthenticatedError(
          'Must be logged in to register to subscription'
        );
      }
      const { session } = await authenticationService.validateSession(
        input.sessionId
      );

      return await subscribeToPushNotificationUseCase(
        input.subscription,
        session.userId
      );
    } catch (error) {
      throw error;
    }
  };
