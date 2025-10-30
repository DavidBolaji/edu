import { ISubscriptionRepository } from '../../repositories/subscription.repository.interface';

export type ISubscribeToPushNotificationUseCase = ReturnType<
  typeof subscribeToPushNotificationUseCase
>;

export const subscribeToPushNotificationUseCase =
  (subscriptionRepository: ISubscriptionRepository) =>
  async (subscription: PushSubscription, userId: string): Promise<boolean> => {
    try {
      return await subscriptionRepository.createSubscription(
        subscription,
        userId
      );
    } catch (error) {
      throw error;
    }
  };
