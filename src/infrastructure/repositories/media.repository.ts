import { db } from '@/prisma';
import { IMediaRepository } from '@/src/application/repositories/media.repository.interface';

// import { ITransaction } from '@/src/entities/models/transaction';
import { Media } from '@prisma/client';

export class MediaRepository implements IMediaRepository {
  constructor() {}

  async getMediaDetails(userId: string): Promise<Media[]> {
    try {
      const media = await db.media.findMany({ where: { userId } });
      return media;
    } catch (error) {
      throw error;
    }
  }
  async getUnviewedMedia(userId: string): Promise<Media[]> {
    try {
      const unviewedMedia = await db.media.findMany({
        where: {
          user: {
            subscribers: {
              some: {
                subscriberId: userId,
              },
            },
          },
          viewedBy: {
            none: {
              userId: userId,
            },
          },
        },
      });

      console.log('SERVER', unviewedMedia);
      return unviewedMedia;
    } catch (error) {
      throw error;
    }
  }

  //   async createMedia(userId: string, tx?: ITransaction): Promise<void> {
  //     const invoker = tx ?? db;
  //     try {
  //       await invoker.wallet.create({
  //         data: {
  //           userId,
  //         },
  //       });
  //     } catch (error) {
  //       throw error;
  //     }
  //   }
}
