import { MediaPlayRepository } from '../repositories/media-play.repository';

export interface MediaPlayTrackingUseCase {
  trackPlay(params: {
    userId: string;
    mediaId: string;
    educatorId: string;
    durationWatched: number;
    mediaDuration: number;
    sessionId: string;
    userAgent: string;
    ipAddress: string;
  }): Promise<{ success: boolean; points?: number; reason?: string }>;
}

export class MediaPlayTrackingUseCaseImpl implements MediaPlayTrackingUseCase {
  constructor(private mediaPlayRepository: MediaPlayRepository) {}

  async trackPlay(params: {
    userId: string;
    mediaId: string;
    educatorId: string;
    durationWatched: number;
    mediaDuration: number;
    sessionId: string;
    userAgent: string;
    ipAddress: string;
  }): Promise<{ success: boolean; points?: number; reason?: string }> {
    const {
      userId,
      mediaId,
      educatorId,
      durationWatched,
      mediaDuration,
      sessionId,
      userAgent,
      ipAddress
    } = params;

    // Prevent self-plays: Educators shouldn't earn points from their own content
    if (userId === educatorId) {
      return {
        success: false,
        reason: 'Educators cannot earn points from watching their own content'
      };
    }

    // Calculate watch ratio
    const watchRatio = durationWatched / mediaDuration;

    // Anti-gaming measures
    const validationResult = await this.validatePlaySession({
      userId,
      mediaId,
      educatorId,
      watchRatio,
      durationWatched,
      mediaDuration,
      sessionId,
      userAgent,
      ipAddress
    });

    if (!validationResult.isValid) {
      return {
        success: false,
        reason: validationResult.reason
      };
    }

    // Only award points if watch ratio >= 30%
    if (watchRatio < 0.3) {
      return {
        success: false,
        reason: 'Insufficient watch time (minimum 30% required)'
      };
    }

    // Create play record
    await this.mediaPlayRepository.createPlay({
      userId,
      mediaId,
      educatorId,
      durationWatched,
      mediaDuration,
      watchRatio,
      sessionId,
      userAgent,
      ipAddress
    });

    // Calculate points based on watch ratio
    const basePoints = 0.2;
    const points = Math.min(basePoints * watchRatio, basePoints);

    return {
      success: true,
      points
    };
  }

  private async validatePlaySession(params: {
    userId: string;
    mediaId: string;
    educatorId: string;
    watchRatio: number;
    durationWatched: number;
    mediaDuration: number;
    sessionId: string;
    userAgent: string;
    ipAddress: string;
  }): Promise<{ isValid: boolean; reason?: string }> {
    const {
      userId,
      mediaId,
      educatorId,
      watchRatio,
      durationWatched,
      mediaDuration,
      sessionId,
      userAgent,
      ipAddress
    } = params;

    // Check for unrealistic watch ratios
    if (watchRatio > 1.1) {
      return {
        isValid: false,
        reason: 'Invalid watch ratio detected'
      };
    }

    // Check for minimum duration (at least 10 seconds)
    if (durationWatched < 10) {
      return {
        isValid: false,
        reason: 'Minimum watch time not met'
      };
    }

    // Check for duplicate plays in short time window (5 minutes)
    const recentPlays = await this.mediaPlayRepository.getRecentPlays({
      userId,
      mediaId,
      timeWindowMinutes: 5
    });

    if (recentPlays.length > 0) {
      return {
        isValid: false,
        reason: 'Duplicate play detected within time window'
      };
    }

    // Check for suspicious activity patterns
    const todayPlays = await this.mediaPlayRepository.getTodayPlays(userId);
    
    // Limit to 50 plays per day per user
    if (todayPlays.length >= 50) {
      return {
        isValid: false,
        reason: 'Daily play limit exceeded'
      };
    }

    // Check for rapid successive plays from same IP
    const ipPlays = await this.mediaPlayRepository.getRecentPlaysByIP({
      ipAddress,
      timeWindowMinutes: 1
    });

    if (ipPlays.length >= 3) {
      return {
        isValid: false,
        reason: 'Too many plays from same IP address'
      };
    }

    return { isValid: true };
  }
}