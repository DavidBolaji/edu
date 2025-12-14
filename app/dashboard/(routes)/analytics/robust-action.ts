'use server';

import db from '@/prisma';
import { getDetails } from '../../_services/user.services';
import { eachDayOfInterval, endOfDay, startOfMonth } from 'date-fns';
import { MonthlySettlementService } from '@/src/application/services/monthly-settlement.service';
import { PointsCalculationService } from '@/src/application/services/points-calculation.service';

const POINT_VALUES = {
  MEDIA_PLAY: 0.2,
  OFFLINE_DOWNLOAD: 3,
  LIVE_CLASS_ATTENDANCE: 5,
};

const getOfflineDownloads = async (
  userId: string,
  startDate: Date,
  endDate: Date
) => {
  return db.offlineDownload.count({
    where: {
      educatorId: userId,
      userId: {
        not: userId, // Exclude self-downloads
      },
      createdAt: { gte: startDate, lte: endDate },
    },
  });
};

const getLiveClassAttendees = async (
  userId: string,
  startDate: Date,
  endDate: Date
) => {
  const liveClasses = await db.liveClass.findMany({
    where: {
      userId: userId, // Filter by the userId of the educator
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      attendees: {
        where: {
          userId: {
            not: userId, // Exclude self-attendance
          },
        },
      },
    },
  });

  return liveClasses.reduce(
    (total, liveClass) => total + liveClass.attendees.length,
    0
  );
};

const getMediaPlays = async (
  userId: string,
  startDate: Date,
  endDate: Date
) => {
  return db.play.count({
    where: {
      educatorId: userId,
      userId: {
        not: userId, // Exclude self-plays
      },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      watchRatio: {
        gte: 0.3, // only count plays where at least 30% was watched
      },
    },
  });
};

const getDailyPoints = async (
  userId: string,
  startDate: Date,
  endDate: Date
) => {
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return Promise.all(
    days.map(async (day: Date) => {
      const nextDay = endOfDay(day);
      const [offlineDownloads, liveClassAttendees, mediaPlays] =
        await Promise.all([
          getOfflineDownloads(userId, day, nextDay),
          getLiveClassAttendees(userId, day, nextDay),
          getMediaPlays(userId, day, nextDay),
        ]);

      const points =
        offlineDownloads * POINT_VALUES.OFFLINE_DOWNLOAD +
        liveClassAttendees * POINT_VALUES.LIVE_CLASS_ATTENDANCE +
        mediaPlays * POINT_VALUES.MEDIA_PLAY;

      return {
        date: day.toISOString(),
        points,
      };
    })
  );
};

export const getRobustAnalyticsService = async (userId: string) => {
  try {
    const settlementService = new MonthlySettlementService();
    const pointsService = new PointsCalculationService();
    
    // Get robust balance calculation using monthly settlements
    const balanceData = await settlementService.getEducatorBalance(userId);
    
    // Get current month statistics for display using corrected service
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    
    const educatorPointsData = await pointsService.calculateEducatorPointsForMonth(userId, currentMonthStart);
    
    const [offlineDownloads, liveClasses, mediaPlays] = await Promise.all([
      getOfflineDownloads(userId, currentMonthStart, now),
      getLiveClassAttendees(userId, currentMonthStart, now),
      getMediaPlays(userId, currentMonthStart, now),
    ]);

    // Generate daily points for current month chart
    const dailyPoints = await getDailyPoints(userId, currentMonthStart, now);

    return {
      // Current month activity (for display)
      offlineDownloads,
      liveClassAttendees: liveClasses,
      mediaPlays,
      totalPoints: educatorPointsData.totalPoints, // Use corrected calculation
      
      // Robust balance calculation
      accruedAmount: balanceData.finalizedBalance,
      totalBalance: balanceData.totalBalance,
      currentMonthEstimate: balanceData.currentMonthEstimate,
      
      // Chart data
      dailyPoints,
      monthlyBreakdown: balanceData.monthlyBreakdown,
      
      // Metadata
      lastWithdrawalDate: null, // Deprecated in favor of monthly system
      calculationPeriod: {
        from: currentMonthStart,
        to: now
      },
      
      // Enhanced debug information
      debug: {
        systemType: 'MONTHLY_SETTLEMENT',
        finalizedBalance: balanceData.finalizedBalance,
        currentMonthEstimate: balanceData.currentMonthEstimate,
        totalBalance: balanceData.totalBalance,
        monthlyBreakdownCount: balanceData.monthlyBreakdown.length,
        currentMonthDetails: balanceData.currentMonthDetails
      }
    };
  } catch (error) {
    console.error('Error in getRobustAnalyticsService:', error);
    throw new Error(`Robust analytics calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getRobustAnalytics = async () => {
  try {
    const userId = (await getDetails()).id;
    const analytics = await getRobustAnalyticsService(userId);
    return analytics;
  } catch (error) {
    console.error('Error fetching robust analytics:', error);
    throw new Error(`Failed to fetch robust analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Monthly settlement management functions
export const calculateSettlementForMonth = async (month: Date) => {
  try {
    const settlementService = new MonthlySettlementService();
    await settlementService.calculateMonthlySettlement(month);
    return { success: true };
  } catch (error) {
    console.error('Error calculating monthly settlement:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

export const getEducatorBalanceBreakdown = async () => {
  try {
    const userId = (await getDetails()).id;
    const settlementService = new MonthlySettlementService();
    const balance = await settlementService.getEducatorBalance(userId);
    return balance;
  } catch (error) {
    console.error('Error getting balance breakdown:', error);
    throw new Error(`Failed to get balance breakdown: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};