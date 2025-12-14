import { NextRequest, NextResponse } from 'next/server';
import db from '@/prisma';
import { getDetails } from '@/app/dashboard/_services/user.services';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { SubscriptionRevenueService } from '@/src/application/services/subscription-revenue.service';
import { PointsCalculationService } from '@/src/application/services/points-calculation.service';

// Consistent point values across the system
const POINT_VALUES = {
  MEDIA_PLAY: 0.2,
  OFFLINE_DOWNLOAD: 3,
  LIVE_CLASS_ATTENDANCE: 5,
};

const EDUCATOR_REVENUE_SHARE = 0.7; // 70% to educators

function round2dp(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    const user = await getDetails();
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { month } = await request.json();
    
    console.log(`🔍 Settlement preview received month parameter: ${month}`);
    
    // Parse the date correctly to avoid timezone issues
    let targetMonth: Date;
    if (month.includes('T')) {
      // Full ISO string
      targetMonth = new Date(month);
    } else {
      // YYYY-MM-DD format - parse as local date
      const [year, monthNum] = month.split('-').map(Number);
      targetMonth = new Date(year, monthNum - 1, 1); // Always use day 1, month is 0-indexed
    }
    
    console.log(`📅 Parsed targetMonth: ${targetMonth.toISOString().slice(0, 10)}`);
    
    const monthStart = startOfMonth(targetMonth);
    const monthEnd = endOfMonth(targetMonth);
    
    console.log(`📅 Month range: ${monthStart.toISOString().slice(0, 10)} to ${monthEnd.toISOString().slice(0, 10)}`);

    console.log(`🔍 Previewing settlement for ${format(monthStart, 'MMMM yyyy')}`);

    // Use corrected services for accurate calculations following rules 1-5
    const revenueService = new SubscriptionRevenueService();
    const pointsService = new PointsCalculationService();
    
    const [revenueData, pointsData] = await Promise.all([
      revenueService.calculateMonthlyRevenue(monthStart),
      pointsService.calculateTotalPointsForMonth(monthStart)
    ]);
    
    const distributableRevenue = revenueService.calculateDistributableRevenue(revenueData.totalRevenue);
    const pointValue = pointsData.totalPoints > 0 
      ? round2dp(distributableRevenue / pointsData.totalPoints) 
      : 0;

    // Get educator earnings preview using corrected logic
    const educatorPreviews = await calculateEducatorEarningsCorrect(monthStart, pointValue, pointsData.totalPoints, pointsService);

    // Get additional subscription metrics
    const additionalMetrics = await getAdditionalSubscriptionMetrics(monthStart, monthEnd);

    const preview = {
      month: format(monthStart, 'MMMM yyyy'),
      totalSubscribers: revenueData.subscriberCount, // Use corrected subscriber count
      totalRevenue: revenueData.totalRevenue, // Show gross revenue with proration
      revenuePool: distributableRevenue, // Show educator share (70%)
      newSubscribers: additionalMetrics.newSubscribers,
      renewedSubscribers: additionalMetrics.renewedSubscribers,
      cancelledSubscribers: additionalMetrics.cancelledSubscribers,
      averageSubscriptionValue: revenueData.subscriberCount > 0 
        ? round2dp(revenueData.totalRevenue / revenueData.subscriberCount) 
        : 0,
      totalPoints: round2dp(pointsData.totalPoints),
      pointValue: round2dp(pointValue),
      activeEducators: educatorPreviews.length,
      pointsBreakdown: {
        plays: {
          count: pointsData.breakdown.mediaPlays.count,
          points: pointsData.breakdown.mediaPlays.points
        },
        downloads: {
          count: pointsData.breakdown.offlineDownloads.count,
          points: pointsData.breakdown.offlineDownloads.points
        },
        liveClasses: {
          count: pointsData.breakdown.liveClassAttendance.count,
          points: pointsData.breakdown.liveClassAttendance.points
        }
      },
      educatorPreviews: educatorPreviews.slice(0, 10), // Top 10 for preview
      summary: {
        totalEarningsToDistribute: round2dp(educatorPreviews.reduce((sum, e) => sum + e.earnings, 0)),
        averageEarnings: educatorPreviews.length > 0 
          ? round2dp(educatorPreviews.reduce((sum, e) => sum + e.earnings, 0) / educatorPreviews.length) 
          : 0,
        topEarner: educatorPreviews.length > 0 
          ? educatorPreviews.reduce((max, e) => e.earnings > max.earnings ? e : max)
          : null
      }
    };

    return NextResponse.json(preview);

  } catch (error) {
    console.error('Settlement preview error:', error);
    return NextResponse.json({
      error: 'Failed to generate settlement preview',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Calculate educator earnings using corrected services
 * Following rules 1-5: Use only subscription records, day-based proration, 70% split
 */
async function calculateEducatorEarningsCorrect(
  monthStart: Date, 
  pointValue: number, 
  systemTotalPoints: number,
  pointsService: PointsCalculationService
) {
  // Get all lecturers
  const lecturers = await db.user.findMany({
    where: { role: 'LECTURER' },
    select: { id: true, fname: true, lname: true, email: true, school: true }
  });

  const educatorEarnings = [];

  for (const lecturer of lecturers) {
    // Use corrected points calculation service
    const educatorPointsData = await pointsService.calculateEducatorPointsForMonth(lecturer.id, monthStart);
    
    if (educatorPointsData.totalPoints > 0) {
      const earnings = round2dp(educatorPointsData.totalPoints * pointValue);
      educatorEarnings.push({
        id: lecturer.id,
        name: `${lecturer.fname} ${lecturer.lname}`,
        email: lecturer.email,
        school: lecturer.school || 'Not specified',
        points: educatorPointsData.totalPoints,
        earnings,
        percentage: systemTotalPoints > 0 ? round2dp((educatorPointsData.totalPoints / systemTotalPoints) * 100) : 0
      });
    }
  }

  // Sort by earnings (descending)
  return educatorEarnings.sort((a, b) => b.earnings - a.earnings);
}

/**
 * Get additional subscription metrics for display purposes
 * Note: This is for UI display only, not for revenue calculation
 */
async function getAdditionalSubscriptionMetrics(monthStart: Date, monthEnd: Date) {
  // Count new subscriptions created in the month
  const newSubscribers = await db.subscriptionPlan.count({
    where: {
      name: 'Premium',
      createdAt: { gte: monthStart, lte: monthEnd }
    }
  });

  // Count renewals (payments marked as renewal)
  const renewedSubscribers = await db.subscriptionPayment.count({
    where: {
      paymentDate: { gte: monthStart, lte: monthEnd },
      paymentStatus: 'COMPLETED',
      isRenewal: true
    }
  });

  // Count cancelled subscriptions
  const cancelledSubscribers = await db.subscriptionHistory.count({
    where: {
      action: 'CANCELLED',
      createdAt: { gte: monthStart, lte: monthEnd }
    }
  });

  return {
    newSubscribers,
    renewedSubscribers,
    cancelledSubscribers
  };
}