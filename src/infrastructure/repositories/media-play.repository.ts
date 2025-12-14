import db from '@/prisma';
import { MediaPlayRepository } from '@/src/application/repositories/media-play.repository';
import { startOfDay, endOfDay, subMinutes } from 'date-fns';

export class MediaPlayRepositoryImpl implements MediaPlayRepository {
  async createPlay(params: {
    userId: string;
    mediaId: string;
    educatorId: string;
    durationWatched: number;
    mediaDuration: number;
    watchRatio: number;
    sessionId: string;
    userAgent: string;
    ipAddress: string;
  }): Promise<void> {
    await db.play.create({
      data: {
        userId: params.userId,
        mediaId: params.mediaId,
        educatorId: params.educatorId,
        durationWatched: params.durationWatched,
        mediaDuration: params.mediaDuration,
        watchRatio: params.watchRatio,
        sessionId: params.sessionId,
        userAgent: params.userAgent,
        ipAddress: params.ipAddress,
      }
    });
  }

  async getRecentPlays(params: {
    userId: string;
    mediaId: string;
    timeWindowMinutes: number;
  }): Promise<Array<{
    id: string;
    createdAt: Date;
    watchRatio: number;
  }>> {
    const cutoffTime = subMinutes(new Date(), params.timeWindowMinutes);
    
    const plays = await db.play.findMany({
      where: {
        userId: params.userId,
        mediaId: params.mediaId,
        createdAt: {
          gte: cutoffTime
        }
      },
      select: {
        id: true,
        createdAt: true,
        watchRatio: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return plays.map(play => ({
      id: play.id,
      createdAt: play.createdAt,
      watchRatio: play.watchRatio || 0
    }));
  }

  async getTodayPlays(userId: string): Promise<Array<{
    id: string;
    createdAt: Date;
  }>> {
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);

    const plays = await db.play.findMany({
      where: {
        userId,
        createdAt: {
          gte: startOfToday,
          lte: endOfToday
        }
      },
      select: {
        id: true,
        createdAt: true
      }
    });

    return plays;
  }

  async getRecentPlaysByIP(params: {
    ipAddress: string;
    timeWindowMinutes: number;
  }): Promise<Array<{
    id: string;
    createdAt: Date;
  }>> {
    const cutoffTime = subMinutes(new Date(), params.timeWindowMinutes);
    
    const plays = await db.play.findMany({
      where: {
        ipAddress: params.ipAddress,
        createdAt: {
          gte: cutoffTime
        }
      },
      select: {
        id: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return plays;
  }
}