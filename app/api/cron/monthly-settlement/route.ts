import { NextRequest, NextResponse } from 'next/server';
import { MonthlySettlementService } from '@/src/application/services/monthly-settlement.service';
import { subMonths, startOfMonth } from 'date-fns';

/**
 * Monthly Settlement Cron Job
 * 
 * This API route handles automated monthly settlements.
 * It should be called on the last day of each month to:
 * 1. Calculate and finalize the previous month's earnings
 * 2. Process any pending settlements
 * 
 * Security: Protected by cron secret to prevent unauthorized access
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    console.log('🚀 Starting monthly settlement cron job...');
    
    const now = new Date();
    
    // Calculate settlement for the previous month (automatic calculation)
    const previousMonthDate = startOfMonth(subMonths(now, 1));
    
    // Structure targetMonth same as revamped version
    const targetMonth = new Date(previousMonthDate.getFullYear(), previousMonthDate.getMonth(), 1);

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
    console.error('❌ Monthly settlement cron job failed:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
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