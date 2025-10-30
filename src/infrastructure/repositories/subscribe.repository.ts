import { db } from '@/prisma';
import { ISubscribeRepository } from '@/src/application/repositories/subscribe.repository.interface';

export class SubscribeRepository implements ISubscribeRepository {
  constructor() {}

  async subscribeToUser(authUser: string, userId: string): Promise<void> {
    try {
      const result = await db.subscription.findMany({
        where: {
          AND: [
            {
              subscribedId: userId,
            },
            {
              subscriberId: authUser,
            },
          ],
        },
      });

      if (result.length > 0) {
        await db.subscription.deleteMany({
          where: {
            AND: [
              {
                subscribedId: userId,
              },
              {
                subscriberId: authUser,
              },
            ],
          },
        });
      } else {
        await db.subscription.create({
          data: {
            subscriberId: authUser, // me
            subscribedId: userId,
          },
        });
      }
    } catch (error) {
      throw error;
    }
  }
}
