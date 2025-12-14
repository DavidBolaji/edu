import { NextRequest, NextResponse } from 'next/server';
import { getDetails } from '@/app/dashboard/_services/user.services';

export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    const user = await getDetails();
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { month } = await request.json();
    const targetMonth = month ? new Date(month) : new Date();

    console.log('🔧 Admin triggering settlement for:', targetMonth.toISOString().slice(0, 7));

    // Call the revamped monthly settlement endpoint
    const settlementUrl = new URL('/api/cron/revamped-monthly-settlement', request.url);
    settlementUrl.searchParams.set('month', targetMonth.toISOString().slice(0, 10));

    const settlementResponse = await fetch(settlementUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add any required headers for internal API calls
      }
    });

    if (!settlementResponse.ok) {
      const errorText = await settlementResponse.text();
      throw new Error(`Settlement API failed: ${errorText}`);
    }

    const settlementResult = await settlementResponse.json();

    if (!settlementResult.success) {
      throw new Error(settlementResult.error || 'Settlement failed');
    }

    return NextResponse.json({
      success: true,
      message: 'Settlement triggered successfully',
      settlement: {
        month: settlementResult.settlement.month,
        totalRevenue: settlementResult.settlement.totalRevenue,
        totalSubscribers: settlementResult.settlement.totalSubscribers,
        totalPoints: settlementResult.settlement.totalPoints,
        pointValue: settlementResult.settlement.pointValue,
        educatorsCount: settlementResult.settlement.educatorCount
      }
    });

  } catch (error) {
    console.error('Trigger settlement error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to trigger settlement',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}