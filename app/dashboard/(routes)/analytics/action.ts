'use server';

import db from '@/prisma';
import { getDetails } from '../../_services/user.services';
import { eachDayOfInterval, endOfDay, startOfMonth } from 'date-fns';
import { SubscriptionRevenueService } from '@/src/application/services/subscription-revenue.service';
import { PointsCalculationService } from '@/src/application/services/points-calculation.service';

const SUBSCRIPTION_FEE = 1000;
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

// This function is now replaced by PointsCalculationService.calculateTotalPointsForMonth()
// Keeping for backward compatibility but will use the corrected service
const getTotalUserPoints = async (startDate: Date, endDate: Date) => {
  const pointsService = new PointsCalculationService();
  const pointsData = await pointsService.calculateTotalPointsForMonth(startDate);
  return pointsData.totalPoints;
};

// This function is now replaced by SubscriptionRevenueService.getSubscribersForMonth()
// Keeping for backward compatibility but will use the corrected service
const getTotalSubscriptions = async () => {
  const revenueService = new SubscriptionRevenueService();
  const currentDate = new Date();
  const subscriberData = await revenueService.getSubscribersForMonth(currentDate);
  return subscriberData.count;
};

export const getSchoolAnalyticsService = async (userId: string) => {
  try {
    const now = new Date();
    
    // Get last processed withdrawal
    const lastProcessedWithdrawal = await db.withdrawalRequest.findFirst({
      where: {
        userId,
        status: 'PROCESSED'
      },
      orderBy: {
        processedAt: 'desc'
      }
    });

    // Calculate from last processed withdrawal date or start of month
    const calculationStartDate = lastProcessedWithdrawal?.processedAt 
      ? new Date(lastProcessedWithdrawal.processedAt)
      : startOfMonth(now);

    // Get all processed withdrawals to calculate total withdrawn amount
    const allProcessedWithdrawals = await db.withdrawalRequest.findMany({
      where: {
        userId,
        status: 'PROCESSED',
        processedAt: {
          gte: calculationStartDate
        }
      },
      select: {
        amount: true
      }
    });

    const totalWithdrawnAmount = allProcessedWithdrawals.reduce(
      (sum, withdrawal) => sum + withdrawal.amount, 
      0
    );

    // Use corrected services for calculations
    const revenueService = new SubscriptionRevenueService();
    const pointsService = new PointsCalculationService();

    const [
      offlineDownloads,
      liveClasses,
      mediaPlays,
      dailyPoints,
      revenueData,
      totalPointsData,
      educatorPointsData
    ] = await Promise.all([
      getOfflineDownloads(userId, calculationStartDate, now),
      getLiveClassAttendees(userId, calculationStartDate, now),
      getMediaPlays(userId, calculationStartDate, now),
      getDailyPoints(userId, calculationStartDate, now),
      revenueService.calculateMonthlyRevenue(calculationStartDate),
      pointsService.calculateTotalPointsForMonth(calculationStartDate),
      pointsService.calculateEducatorPointsForMonth(userId, calculationStartDate)
    ]);

    const totalPoints = educatorPointsData.totalPoints;
    const distributableRevenue = revenueService.calculateDistributableRevenue(revenueData.totalRevenue);

    // Calculate gross earnings using corrected logic
    const grossEarnings = totalPointsData.totalPoints > 0
      ? (totalPoints / totalPointsData.totalPoints) * distributableRevenue
      : 0;

    // Calculate net available amount (gross earnings - already withdrawn)
    const accruedAmount = Math.max(0, grossEarnings - totalWithdrawnAmount);

    return {
      offlineDownloads,
      liveClassAttendees: liveClasses,
      mediaPlays,
      totalPoints,
      accruedAmount,
      dailyPoints,
      lastWithdrawalDate: lastProcessedWithdrawal?.processedAt || null,
      calculationPeriod: {
        from: calculationStartDate,
        to: now
      },
      // Debug information with corrected values
      debug: {
        totalSchoolPoints: totalPointsData.totalPoints,
        totalSubscriptions: revenueData.subscriberCount,
        revenuePool: distributableRevenue,
        yourShare: totalPointsData.totalPoints > 0 ? (totalPoints / totalPointsData.totalPoints) : 0,
        grossEarnings,
        totalWithdrawnAmount,
        lastProcessedWithdrawal: lastProcessedWithdrawal?.processedAt || null,
        // Additional debug info
        totalRevenue: revenueData.totalRevenue,
        subscriberCount: revenueData.subscriberCount,
        pointValue: totalPointsData.totalPoints > 0 ? distributableRevenue / totalPointsData.totalPoints : 0
      }
    };
  } catch (error) {
    console.error('Error in getSchoolAnalyticsService:', error);
    throw new Error(`Analytics calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getAnalytics = async () => {
  try {
    const userId = (await getDetails()).id;
    const analytics = await getSchoolAnalyticsService(userId);
    return analytics;
  } catch (error) {
    console.error('Error fetching analytics:', error);
    throw new Error(`Failed to fetch analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
