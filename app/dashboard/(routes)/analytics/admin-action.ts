'use server';

import db from '@/prisma';
import { getDetails } from '../../_services/user.services';
import { startOfMonth, endOfMonth } from 'date-fns';
import { SubscriptionRevenueService } from '@/src/application/services/subscription-revenue.service';
import { PointsCalculationService } from '@/src/application/services/points-calculation.service';

const POINT_VALUES = {
  MEDIA_PLAY: 0.2,
  OFFLINE_DOWNLOAD: 3,
  LIVE_CLASS_ATTENDANCE: 5,
};

const SUBSCRIPTION_FEE = 1000;
const EDUCATOR_REVENUE_SHARE = 0.7;

// Consistent rounding function
function round2dp(value: any) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export const getAdminAnalytics = async () => {
  try {
    const user = await getDetails();
    
    if (user.role !== 'ADMIN') {
      throw new Error('Admin access required');
    }

    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);

    console.log('🔍 Admin Analytics - Current Month:', currentMonthStart.toISOString().slice(0, 7));
    
    // Use corrected services for accurate calculations
    const revenueService = new SubscriptionRevenueService();
    const pointsService = new PointsCalculationService();
    
    const [revenueData, pointsData] = await Promise.all([
      revenueService.calculateMonthlyRevenue(currentMonthStart),
      pointsService.calculateTotalPointsForMonth(currentMonthStart)
    ]);
    
    const distributableRevenue = revenueService.calculateDistributableRevenue(revenueData.totalRevenue);
    const pointValue = pointsData.totalPoints > 0 
      ? round2dp(distributableRevenue / pointsData.totalPoints)
      : 0;

    // Get active educators count
    const activeEducators = await db.user.count({
      where: {
        role: 'LECTURER',
        createdAt: { lte: currentMonthEnd }
      }
    });

    const result = {
      // System overview
      totalSubscribers: revenueData.subscriberCount,
      paidSubscribers: revenueData.subscriberCount, // All counted subscribers are paid (premium only)
      revenuePool: distributableRevenue,
      totalPoints: round2dp(pointsData.totalPoints),
      pointValue: round2dp(pointValue),
      activeEducators,
      
      // Activity breakdown
      offlineDownloads: pointsData.breakdown.offlineDownloads.count,
      liveClassAttendees: pointsData.breakdown.liveClassAttendance.count,
      mediaPlays: pointsData.breakdown.mediaPlays.count,
      
      // For compatibility with existing UI
      accruedAmount: 0,
      dailyPoints: [],
      lastWithdrawalDate: null,
      
      calculationPeriod: {
        from: currentMonthStart,
        to: now
      },
      
      debug: {
        systemType: 'ADMIN_OVERVIEW',
        currentMonth: currentMonthStart.toISOString().slice(0, 7),
        totalSubscribers: revenueData.subscriberCount,
        paidSubscribers: revenueData.subscriberCount,
        revenuePool: distributableRevenue,
        totalRevenue: revenueData.totalRevenue,
        totalPoints: round2dp(pointsData.totalPoints),
        totalSchoolPoints: round2dp(pointsData.totalPoints),
        pointValue: round2dp(pointValue),
        activeEducators,
        currentMonthDetails: {
          totalSubscribers: revenueData.subscriberCount,
          revenuePool: distributableRevenue,
          totalPoints: round2dp(pointsData.totalPoints)
        }
      }
    };

    console.log('✅ Admin Analytics Final Result:', result);
    return result;

  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    throw new Error(`Failed to fetch admin analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

