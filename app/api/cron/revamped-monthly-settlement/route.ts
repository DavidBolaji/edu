import { NextRequest, NextResponse } from 'next/server';

import { MonthlySettlementService } from '@/src/application/services/monthly-settlement.service';

export async function POST(request: NextRequest) {
  try {
    // Get the month to process (default to current month)
    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month');
    
    let targetMonth: Date;
    if (monthParam) {
      console.log(`🔧 Received monthParam: ${monthParam}`);
      
      // Parse the date correctly to avoid timezone issues
      if (monthParam.includes('T')) {
        // Full ISO string
        const parsedDate = new Date(monthParam);
        targetMonth = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1);
      } else {
        // YYYY-MM-DD format - parse as local date
        const [year, monthNum] = monthParam.split('-').map(Number);
        targetMonth = new Date(year, monthNum - 1, 1); // Always use day 1, month is 0-indexed
      }
    } else {
      const now = new Date();
      targetMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    console.log(`🔧 Processing settlement for ${targetMonth.toISOString().slice(0, 7)} using corrected services`);
    console.log(`📅 Final targetMonth: ${targetMonth.toISOString().slice(0, 10)}`);

    // Use the corrected MonthlySettlementService that follows rules 1-5
    const settlementService = new MonthlySettlementService();
    
    // This will handle all the corrected logic and return settlement data:
    // - Day-based proration for revenue
    // - Subscription overlap logic
    // - 70% educator revenue share
    // - Proper points calculation
    const settlementResult = await settlementService.calculateMonthlySettlement(targetMonth);

    return NextResponse.json({
      success: true,
      settlement: {
        id: settlementResult.id,
        month: settlementResult.month,
        totalSubscribers: settlementResult.totalSubscribers,
        totalRevenue: settlementResult.totalRevenue,
        newSubscribers: 0, // Not tracked in current implementation
        renewedSubscribers: 0, // Not tracked in current implementation
        cancelledSubscribers: 0, // Not tracked in current implementation
        averageSubscriptionValue: settlementResult.totalSubscribers > 0 
          ? settlementResult.totalRevenue / settlementResult.totalSubscribers 
          : 0,
        totalPoints: settlementResult.totalPoints,
        pointValue: settlementResult.pointValue,
        educatorCount: settlementResult.educatorCount
      }
    });

  } catch (error) {
    console.error('Monthly settlement error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// All calculation logic has been moved to MonthlySettlementService
// which implements the corrected rules 1-5:
// - Day-based proration for revenue calculation
// - Subscription overlap logic for active subscribers
// - 70% educator revenue share
// - Proper points calculation excluding self-activity

export async function GET(request: NextRequest) {
  return POST(request);
}