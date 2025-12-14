import db from '@/prisma';
import { startOfMonth, endOfMonth } from 'date-fns';

const POINT_VALUES = {
  MEDIA_PLAY: 0.2,
  OFFLINE_DOWNLOAD: 3,
  LIVE_CLASS_ATTENDANCE: 5,
};

export class PointsCalculationService {
  
  /**
   * Calculate total points for all educators in a given month
   */
  async calculateTotalPointsForMonth(targetMonth: Date): Promise<{
    totalPoints: number;
    breakdown: {
      offlineDownloads: { count: number; points: number };
      liveClassAttendance: { count: number; points: number };
      mediaPlays: { count: number; points: number };
    };
  }> {
    const monthStart = startOfMonth(targetMonth);
    const monthEnd = endOfMonth(targetMonth);
    
    console.log(`🔍 Calculating points for ${monthStart.toISOString().slice(0, 7)}`);
    console.log(`📅 Points calculation range: ${monthStart.toISOString()} to ${monthEnd.toISOString()}`);
    
    // Get offline downloads (exclude self-downloads)
    const offlineDownloadCount = await db.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM OfflineDownload 
      WHERE createdAt >= ${monthStart} 
      AND createdAt <= ${monthEnd}
      AND userId != educatorId
    `.then(result => Number(result[0]?.count || 0));
    
    console.log(`📥 Offline downloads (excluding self): ${offlineDownloadCount}`);
    
    // Get live class attendance (exclude self-attendance)
    const liveClassAttendance = await db.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM LiveClassAttendee lca
      JOIN LiveClass lc ON lca.liveClassId = lc.id
      WHERE lca.joinedAt >= ${monthStart} 
      AND lca.joinedAt <= ${monthEnd}
      AND lca.userId != lc.userId
    `;
    const liveClassCount = Number(liveClassAttendance[0]?.count || 0);
    
    // Get media plays with 30%+ watch ratio (exclude self-plays)
    const mediaPlayCount = await db.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM Play 
      WHERE createdAt >= ${monthStart} 
      AND createdAt <= ${monthEnd}
      AND watchRatio >= 0.3
      AND userId != educatorId
    `.then(result => Number(result[0]?.count || 0));
    
    // Calculate points
    const offlineDownloadPoints = offlineDownloadCount * POINT_VALUES.OFFLINE_DOWNLOAD;
    const liveClassPoints = liveClassCount * POINT_VALUES.LIVE_CLASS_ATTENDANCE;
    const mediaPlayPoints = mediaPlayCount * POINT_VALUES.MEDIA_PLAY;
    
    const totalPoints = offlineDownloadPoints + liveClassPoints + mediaPlayPoints;
    
    console.log(`📊 Points breakdown for ${monthStart.toISOString().slice(0, 7)}:`);
    console.log(`  - Offline Downloads: ${offlineDownloadCount} × ${POINT_VALUES.OFFLINE_DOWNLOAD} = ${offlineDownloadPoints}`);
    console.log(`  - Live Class Attendance: ${liveClassCount} × ${POINT_VALUES.LIVE_CLASS_ATTENDANCE} = ${liveClassPoints}`);
    console.log(`  - Media Plays: ${mediaPlayCount} × ${POINT_VALUES.MEDIA_PLAY} = ${mediaPlayPoints}`);
    console.log(`  - Total Points: ${totalPoints}`);
    
    return {
      totalPoints: Math.round(totalPoints * 100) / 100,
      breakdown: {
        offlineDownloads: { count: offlineDownloadCount, points: offlineDownloadPoints },
        liveClassAttendance: { count: liveClassCount, points: liveClassPoints },
        mediaPlays: { count: mediaPlayCount, points: mediaPlayPoints }
      }
    };
  }
  
  /**
   * Calculate points for a specific educator in a given month
   */
  async calculateEducatorPointsForMonth(
    educatorId: string, 
    targetMonth: Date
  ): Promise<{
    totalPoints: number;
    breakdown: {
      offlineDownloads: { count: number; points: number };
      liveClassAttendance: { count: number; points: number };
      mediaPlays: { count: number; points: number };
    };
  }> {
    const monthStart = startOfMonth(targetMonth);
    const monthEnd = endOfMonth(targetMonth);
    
    // Get educator's offline downloads (exclude self-downloads)
    const offlineDownloadCount = await db.offlineDownload.count({
      where: {
        educatorId,
        createdAt: { gte: monthStart, lte: monthEnd },
        userId: { not: educatorId }
      }
    });
    
    // Get educator's live class attendance (exclude self-attendance)
    const liveClassAttendance = await db.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM LiveClassAttendee lca
      JOIN LiveClass lc ON lca.liveClassId = lc.id
      WHERE lc.userId = ${educatorId}
      AND lca.joinedAt >= ${monthStart} 
      AND lca.joinedAt <= ${monthEnd}
      AND lca.userId != ${educatorId}
    `;
    const liveClassCount = Number(liveClassAttendance[0]?.count || 0);
    
    // Get educator's media plays with 30%+ watch ratio (exclude self-plays)
    const mediaPlayCount = await db.play.count({
      where: {
        educatorId,
        createdAt: { gte: monthStart, lte: monthEnd },
        watchRatio: { gte: 0.3 },
        userId: { not: educatorId }
      }
    });
    
    // Calculate points
    const offlineDownloadPoints = offlineDownloadCount * POINT_VALUES.OFFLINE_DOWNLOAD;
    const liveClassPoints = liveClassCount * POINT_VALUES.LIVE_CLASS_ATTENDANCE;
    const mediaPlayPoints = mediaPlayCount * POINT_VALUES.MEDIA_PLAY;
    
    const totalPoints = offlineDownloadPoints + liveClassPoints + mediaPlayPoints;
    
    return {
      totalPoints: Math.round(totalPoints * 100) / 100,
      breakdown: {
        offlineDownloads: { count: offlineDownloadCount, points: offlineDownloadPoints },
        liveClassAttendance: { count: liveClassCount, points: liveClassPoints },
        mediaPlays: { count: mediaPlayCount, points: mediaPlayPoints }
      }
    };
  }
  
  /**
   * Get all active educators for a given month
   */
  async getActiveEducatorsForMonth(targetMonth: Date): Promise<string[]> {
    const monthStart = startOfMonth(targetMonth);
    const monthEnd = endOfMonth(targetMonth);
    
    // Use raw SQL to get educators with activity (excluding self-activity)
    const activeEducatorIds = await db.$queryRaw<Array<{ userId: string }>>`
      SELECT DISTINCT u.id as userId
      FROM User u
      WHERE u.role = 'LECTURER'
      AND (
        -- Had media plays (excluding self-plays)
        EXISTS (
          SELECT 1 FROM Play p 
          WHERE p.educatorId = u.id 
          AND p.createdAt >= ${monthStart} 
          AND p.createdAt <= ${monthEnd}
          AND p.watchRatio >= 0.3
          AND p.userId != p.educatorId
        )
        OR
        -- Had offline downloads (excluding self-downloads)
        EXISTS (
          SELECT 1 FROM OfflineDownload od 
          WHERE od.educatorId = u.id 
          AND od.createdAt >= ${monthStart} 
          AND od.createdAt <= ${monthEnd}
          AND od.userId != od.educatorId
        )
        OR
        -- Had live class attendance (excluding self-attendance)
        EXISTS (
          SELECT 1 FROM LiveClass lc
          JOIN LiveClassAttendee lca ON lca.liveClassId = lc.id
          WHERE lc.userId = u.id 
          AND lca.joinedAt >= ${monthStart} 
          AND lca.joinedAt <= ${monthEnd}
          AND lca.userId != lc.userId
        )
      )
    `;
    
    return activeEducatorIds.map(row => row.userId);
  }
}