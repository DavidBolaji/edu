import { WebPush } from '@prisma/client';

export interface ISubscriptionRepository {
  getSubscriptionById(userId: string): Promise<Pick<WebPush, 'pushUrl'>[]>;
  createSubscription(input: PushSubscription, userId: string): Promise<boolean>;
}
