import { NextRequest, NextResponse } from 'next/server';
import db from '@/prisma';
import { EnhancedSubscriptionService } from '@/src/application/services/enhanced-subscription.service';


const subscriptionService = new EnhancedSubscriptionService(db);

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Processing subscription status updates...');

    // Process expired subscriptions and grace periods
    await subscriptionService.processExpiredSubscriptions();

    // Reset monthly usage counters if it's the first day of the month
    const now = new Date();
    if (now.getDate() === 1) {
      await resetMonthlyUsage();
    }

    console.log('✅ Subscription processing completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Subscription processing completed',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error processing subscriptions:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process subscriptions',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function resetMonthlyUsage() {
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  // Create new usage records for all active subscribers
  const activeSubscriptions = await db.subscriptionPlan.findMany({
    where: {
      status: { in: ['ACTIVE', 'TRIAL', 'GRACE_PERIOD'] }
    },
    select: { userId: true }
  });

  for (const subscription of activeSubscriptions) {
    await db.subscriptionUsage.upsert({
      where: {
        userId_month: {
          userId: subscription.userId,
          month: currentMonth
        }
      },
      update: {
        downloadsUsed: 0,
        liveClassesUsed: 0,
        lastResetDate: new Date()
      },
      create: {
        userId: subscription.userId,
        month: currentMonth,
        downloadsUsed: 0,
        liveClassesUsed: 0,
        lastResetDate: new Date()
      }
    });
  }

  console.log(`🔄 Reset monthly usage for ${activeSubscriptions.length} subscribers`);
}