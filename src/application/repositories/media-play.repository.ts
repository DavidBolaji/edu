export interface MediaPlayRepository {
  createPlay(params: {
    userId: string;
    mediaId: string;
    educatorId: string;
    durationWatched: number;
    mediaDuration: number;
    watchRatio: number;
    sessionId: string;
    userAgent: string;
    ipAddress: string;
  }): Promise<void>;

  getRecentPlays(params: {
    userId: string;
    mediaId: string;
    timeWindowMinutes: number;
  }): Promise<Array<{
    id: string;
    createdAt: Date;
    watchRatio: number;
  }>>;

  getTodayPlays(userId: string): Promise<Array<{
    id: string;
    createdAt: Date;
  }>>;

  getRecentPlaysByIP(params: {
    ipAddress: string;
    timeWindowMinutes: number;
  }): Promise<Array<{
    id: string;
    createdAt: Date;
  }>>;
}