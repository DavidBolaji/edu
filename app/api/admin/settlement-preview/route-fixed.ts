import { NextRequest, NextResponse } from 'next/server';
import db from '@/prisma';
import { getDetails } from '@/app/dashboard/_services/user.services';
import { startOfMonth, endOfMonth, format } from 'date-fns';

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
    const targetMonth = new Date(month);
    const monthStart = startOfMonth(targetMonth);
    const monthEnd = endOfMonth(targetMonth);

    console.log(`🔍 Previewing settlement for ${format(monthStart, 'MMMM yyyy')}`);

    // Calculate subscription metrics with CORRECT revenue share application
    const subscriptionMetrics = await calculateSubscriptionMetricsFixed(monthStart, monthEnd);
    
    // Calculate total points
    const totalPoints = await calculateTotalPointsFixed(monthStart, monthEnd);
    
    // Calculate point value with proper rounding
    const pointValue = totalPoints > 0 
      ? round2dp(subscriptionMetrics.revenuePool / totalPoints) 
      : 0;

    // Get educator earnings preview
    const educatorPreviews = await calculateEducatorEarningsFixed(monthStart, monthEnd, pointValue, totalPoints);

    // Calculate points breakdown
    const pointsBreakdown = await calculatePointsBreakdownFixed(monthStart, monthEnd);

    const preview = {
      month: format(monthStart, 'MMMM yyyy'),
      totalSubscribers: subscriptionMetrics.payingSubscribers, // Use paying subscribers for the month
      totalRevenue: subscriptionMetrics.grossRevenue, // Show gross revenue
      revenuePool: subscriptionMetrics.revenuePool, // Show educator share (70%)
      newSubscribers: subscriptionMetrics.newSubscribers,
      renewedSubscribers: subscriptionMetrics.renewedSubscribers,
      cancelledSubscribers: subscriptionMetrics.cancelledSubscribers,
      averageSubscriptionValue: subscriptionMetrics.averageSubscriptionValue,
      totalPoints: round2dp(totalPoints),
      pointValue: round2dp(pointValue),
      activeEducators: educatorPreviews.length,
      pointsBreakdown,
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

async function calculateSubscriptionMetricsFixed(monthStart: Date, monthEnd: Date) {
  console.log(`🔍 Calculating FIXED subscription metrics for ${monthStart.toISOString().slice(0, 7)}`);

  // Get payments made during the target month (this is the actual revenue)
  const paymentsInMonth = await db.subscriptionPayment.findMany({
    where: {
      paymentDate: { gte: monthStart, lte: monthEnd },
      paymentStatus: 'COMPLETED'
    }
  });

  let grossRevenue = 0;
  const payingSubscriberIds = new Set<string>();
  let newSubscribers = 0;
  let renewedSubscribers = 0;

  console.log(`📊 Found ${paymentsInMonth.length} payments in month`);

  // Calculate gross revenue from actual payments
  for (const payment of paymentsInMonth) {
    payingSubscriberIds.add(payment.userId);
    const monthlyRevenue = payment.currentMonthRevenue || payment.monthlyAmount;
    grossRevenue += monthlyRevenue;
    
    if (payment.isRenewal) {
      renewedSubscribers++;
    } else {
      newSubscribers++;
    }
  }

  // If no payments, use fallback method (active subscriptions)
  if (grossRevenue === 0) {
    console.log('⚠️ No payments found, using active subscription fallback');
    
    const activeSubscriptions = await db.subscriptionPlan.findMany({
      where: {
        name: 'Premium',
        status: 'ACTIVE',
        createdAt: { lte: monthEnd },
        expiresAt: { gte: monthStart }
      }
    });

    for (const subscription of activeSubscriptions) {
      payingSubscriberIds.add(subscription.userId);
      grossRevenue += subscription.price;
    }
  }

  // Apply educator revenue share (70%)
  const revenuePool = round2dp(grossRevenue * EDUCATOR_REVENUE_SHARE);

  // Count cancelled subscriptions
  const cancelledSubscribers = await db.subscriptionHistory.count({
    where: {
      action: 'CANCELLED',
      createdAt: { gte: monthStart, lte: monthEnd }
    }
  });

  const averageSubscriptionValue = payingSubscriberIds.size > 0 
    ? round2dp(grossRevenue / payingSubscriberIds.size) 
    : 0;

  console.log(`✅ FIXED Metrics: Gross ₦${grossRevenue}, Pool ₦${revenuePool}, Paying subscribers ${payingSubscriberIds.size}`);

  return {
    payingSubscribers: payingSubscriberIds.size, // Actual paying subscribers for this month
    grossRevenue: round2dp(grossRevenue),
    revenuePool, // This is what gets distributed (70% of gross)
    newSubscribers,
    renewedSubscribers,
    cancelledSubscribers,
    averageSubscriptionValue
  };
}

async function calculateTotalPointsFixed(monthStart: Date, monthEnd: Date) {
  // Calculate points from plays using sum of watchRatio
  const playPoints = await db.play.aggregate({
    where: {
      createdAt: { gte: monthStart, lte: monthEnd },
      watchRatio: { gte: 0.3 }
    },
    _sum: { watchRatio: true }
  });

  // Calculate points from live class attendees
  const liveClassPoints = await db.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(*) as count
    FROM LiveClassAttendee lca
    JOIN LiveClass lc ON lca.liveClassId = lc.id
    WHERE lca.joinedAt >= ${monthStart} AND lca.joinedAt <= ${monthEnd}
  `.then(result => Number(result[0]?.count || 0));

  // Calculate points from offline downloads
  const downloadPoints = await db.offlineDownload.count({
    where: {
      createdAt: { gte: monthStart, lte: monthEnd }
    }
  });

  // Calculate total points using consistent point values
  const totalPlayPoints = (playPoints._sum.watchRatio || 0) * POINT_VALUES.MEDIA_PLAY;
  const totalDownloadPoints = downloadPoints * POINT_VALUES.OFFLINE_DOWNLOAD;
  const totalLiveClassPoints = liveClassPoints * POINT_VALUES.LIVE_CLASS_ATTENDANCE;
  
  return round2dp(totalPlayPoints + totalDownloadPoints + totalLiveClassPoints);
}

async function calculatePointsBreakdownFixed(monthStart: Date, monthEnd: Date) {
  const [plays, downloads, liveClassAttendees] = await Promise.all([
    db.play.aggregate({
      where: {
        createdAt: { gte: monthStart, lte: monthEnd },
        watchRatio: { gte: 0.3 }
      },
      _count: true,
      _sum: { watchRatio: true }
    }),
    db.offlineDownload.count({
      where: {
        createdAt: { gte: monthStart, lte: monthEnd }
      }
    }),
    db.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*) as count
      FROM LiveClassAttendee lca
      JOIN LiveClass lc ON lca.liveClassId = lc.id
      WHERE lca.joinedAt >= ${monthStart} AND lca.joinedAt <= ${monthEnd}
    `
  ]);

  const liveClassCount = Number(liveClassAttendees[0]?.count || 0);

  return {
    plays: {
      count: plays._count,
      points: round2dp((plays._sum.watchRatio || 0) * POINT_VALUES.MEDIA_PLAY)
    },
    downloads: {
      count: downloads,
      points: downloads * POINT_VALUES.OFFLINE_DOWNLOAD
    },
    liveClasses: {
      count: liveClassCount,
      points: liveClassCount * POINT_VALUES.LIVE_CLASS_ATTENDANCE
    }
  };
}

async function calculateEducatorEarningsFixed(monthStart: Date, monthEnd: Date, pointValue: number, systemTotalPoints: number) {
  // Get all lecturers
  const lecturers = await db.user.findMany({
    where: { role: 'LECTURER' },
    select: { id: true, fname: true, lname: true, email: true, school: true }
  });

  const educatorEarnings = [];

  for (const lecturer of lecturers) {
    // Calculate points for this educator
    const [downloads, liveClassAttendees, plays] = await Promise.all([
      db.offlineDownload.count({
        where: {
          educatorId: lecturer.id,
          createdAt: { gte: monthStart, lte: monthEnd },
          userId: { not: lecturer.id }
        }
      }),
      db.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(*) as count
        FROM LiveClassAttendee lca
        JOIN LiveClass lc ON lca.liveClassId = lc.id
        WHERE lc.userId = ${lecturer.id}
        AND lca.joinedAt >= ${monthStart} AND lca.joinedAt <= ${monthEnd}
        AND lca.userId != ${lecturer.id}
      `.then(result => Number(result[0]?.count || 0)),
      db.play.aggregate({
        where: {
          educatorId: lecturer.id,
          createdAt: { gte: monthStart, lte: monthEnd },
          userId: { not: lecturer.id },
          watchRatio: { gte: 0.3 }
        },
        _sum: { watchRatio: true }
      })
    ]);

    const points = round2dp(
      downloads * POINT_VALUES.OFFLINE_DOWNLOAD +
      liveClassAttendees * POINT_VALUES.LIVE_CLASS_ATTENDANCE +
      (plays._sum.watchRatio || 0) * POINT_VALUES.MEDIA_PLAY
    );

    if (points > 0) {
      const earnings = round2dp(points * pointValue);
      educatorEarnings.push({
        id: lecturer.id,
        name: `${lecturer.fname} ${lecturer.lname}`,
        email: lecturer.email,
        school: lecturer.school || 'Not specified',
        points,
        earnings,
        percentage: systemTotalPoints > 0 ? round2dp((points / systemTotalPoints) * 100) : 0
      });
    }
  }

  // Sort by earnings (descending)
  return educatorEarnings.sort((a, b) => b.earnings - a.earnings);
}