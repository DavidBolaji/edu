import db from '@/prisma';
import { ISubscriptionRepository } from '@/src/application/repositories/subscription.repository.interface';
import { WebPush } from '@prisma/client';

export class SubscriptionRepository implements ISubscriptionRepository {
  private async getSubscription(subscription: PushSubscription) {
    try {
      const sub = await db.webPush.findMany({
        where: {
          pushUrl: JSON.stringify(subscription),
        },
      });
      return !!sub.length;
    } catch (error) {
      throw error;
    }
  }

  async getSubscriptionById(
    userId: string
  ): Promise<Pick<WebPush, 'pushUrl'>[]> {
    try {
      const subscription = await db.webPush.findMany({
        where: {
          userId,
        },
        select: {
          pushUrl: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      // console.log('SUBSCRIPTION', subscription);
      return subscription;
    } catch (error) {
      throw error;
    }
  }

  async createSubscription(
    input: PushSubscription,
    userId: string
  ): Promise<boolean> {
    // const exist = await this.getSubscription(input);
    // if (exist) return true;

    try {
      await db.webPush.create({
        data: {
          pushUrl: JSON.stringify(input),
          userId,
        },
      });
      return true;
    } catch (error) {
      throw error;
    }
  }
}
