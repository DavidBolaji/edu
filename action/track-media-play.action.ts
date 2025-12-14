'use server';

import { headers } from 'next/headers';
import { MediaPlayTrackingUseCaseImpl } from '@/src/application/use-case/media-play-tracking.use-case';
import { MediaPlayRepositoryImpl } from '@/src/infrastructure/repositories/media-play.repository';
import { getDetails } from '@/app/dashboard/_services/user.services';

export async function trackMediaPlay(params: {
  mediaId: string;
  educatorId: string;
  durationWatched: number;
  mediaDuration: number;
  sessionId: string;
}) {
  try {
    const user = await getDetails();
    const headersList = headers();
    
    const userAgent = headersList.get('user-agent') || 'unknown';
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0] || realIp || 'unknown';

    const mediaPlayRepository = new MediaPlayRepositoryImpl();
    const mediaPlayTrackingUseCase = new MediaPlayTrackingUseCaseImpl(mediaPlayRepository);

    const result = await mediaPlayTrackingUseCase.trackPlay({
      userId: user.id,
      mediaId: params.mediaId,
      educatorId: params.educatorId,
      durationWatched: params.durationWatched,
      mediaDuration: params.mediaDuration,
      sessionId: params.sessionId,
      userAgent,
      ipAddress
    });

    return result;
  } catch (error) {
    console.error('Error tracking media play:', error);
    return {
      success: false,
      reason: 'Internal server error'
    };
  }
}