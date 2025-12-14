import { NextRequest, NextResponse } from 'next/server';
import db from '@/prisma';
import { getDetails } from '@/app/dashboard/_services/user.services';
import { format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    // Check admin authorization
    const user = await getDetails();
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.log('📊 Fetching settlement details for admin...');

    // Get all settlements with educator earnings
    const settlements = await db.monthlySettlement.findMany({
      orderBy: { month: 'desc' },
      take: 12, // Last 12 months
      include: {
        educatorEarnings: {
          include: {
            user: {
              select: {
                id: true,
                fname: true,
                lname: true,
                email: true,
                school: true
              }
            }
          },
          orderBy: { earnings: 'desc' }
        }
      }
    });

    // Transform data for frontend
    const settlementData = settlements.map(settlement => {
      const educators = settlement.educatorEarnings.map(earning => ({
        name: `${earning.user.fname} ${earning.user.lname}`,
        email: earning.user.email,
        school: earning.user.school || 'Not specified',
        statistics: {
          points: earning.points,
          earnings: earning.earnings,
          availableBalance: earning.availableBalance,
          withdrawn: earning.withdrawn
        }
      }));

      const analytics = {
        totalEducators: educators.length,
        totalEarnings: settlement.educatorEarnings.reduce((sum, e) => sum + e.earnings, 0),
        totalWithdrawn: settlement.educatorEarnings.reduce((sum, e) => sum + e.withdrawn, 0),
        totalAvailable: settlement.educatorEarnings.reduce((sum, e) => sum + e.availableBalance, 0),
        averageEarnings: educators.length > 0 
          ? settlement.educatorEarnings.reduce((sum, e) => sum + e.earnings, 0) / educators.length 
          : 0,
        topEarner: educators.length > 0 
          ? educators.reduce((max, e) => e.statistics.earnings > max.statistics.earnings ? e : max)
          : null
      };

      return {
        settlement: {
          month: format(settlement.month, 'MMMM yyyy'),
          totalRevenue: settlement.totalRevenue,
          totalPoints: settlement.totalPoints,
          pointValue: settlement.pointValue,
          totalSubscribers: settlement.totalSubscribers,
          status: settlement.status,
          finalizedAt: settlement.finalizedAt,
          newSubscribers: settlement.newSubscribers,
          renewedSubscribers: settlement.renewedSubscribers,
          cancelledSubscribers: settlement.cancelledSubscribers,
          averageSubscriptionValue: settlement.averageSubscriptionValue
        },
        educators,
        analytics
      };
    });

    return NextResponse.json({
      success: true,
      settlements: settlementData,
      summary: {
        totalSettlements: settlements.length,
        latestMonth: settlements.length > 0 ? format(settlements[0].month, 'MMMM yyyy') : null,
        totalRevenueAllTime: settlements.reduce((sum, s) => sum + s.totalRevenue, 0),
        totalEducatorsAllTime: new Set(
          settlements.flatMap(s => s.educatorEarnings.map(e => e.userId))
        ).size
      }
    });

  } catch (error) {
    console.error('Settlement details error:', error);
    return NextResponse.json({
      error: 'Failed to fetch settlement details',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}