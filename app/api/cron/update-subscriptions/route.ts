import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionStatusService } from '@/src/application/services/subscription-status.service';

/**
 * Daily Subscription Status Update Cron
 * Updates expired subscriptions to EXPIRED status
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Starting subscription status update...');
    
    const subscriptionService = new SubscriptionStatusService();
    const updatedCount = await subscriptionService.updateExpiredSubscriptions();

    console.log(`✅ Updated ${updatedCount} expired subscriptions`);

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} expired subscriptions`,
      updatedCount
    });

  } catch (error) {
    console.error('❌ Subscription status update failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Subscription update failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Subscription status update cron endpoint',
    schedule: 'Daily at 00:30 UTC',
    purpose: 'Updates expired subscriptions to EXPIRED status'
  });
}