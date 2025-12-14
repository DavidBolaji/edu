import db from '@/prisma';
import { startOfMonth, endOfMonth, getDaysInMonth, differenceInDays, min, max } from 'date-fns';

const SUBSCRIPTION_PRICE = 1000; // ₦1000 per month
const EDUCATOR_REVENUE_SHARE = 0.7; // 70% to educators

export class SubscriptionRevenueService {
  
  /**
   * Calculate monthly revenue using day-based proration
   * Only uses subscription records as source of truth
   */
  async calculateMonthlyRevenue(targetMonth: Date): Promise<{
    totalRevenue: number;
    subscriberCount: number;
    subscriptions: Array<{
      userId: string;
      startDate: Date;
      endDate: Date;
      activeDaysInMonth: number;
      revenueContribution: number;
    }>;
  }> {
    const monthStart = startOfMonth(targetMonth);
    const monthEnd = endOfMonth(targetMonth);
    const daysInMonth = getDaysInMonth(targetMonth);
    
    console.log(`🔍 Calculating revenue for ${monthStart.toISOString().slice(0, 7)}`);
    console.log(`📅 Month has ${daysInMonth} days`);
    console.log(`📅 Month range: ${monthStart.toISOString()} to ${monthEnd.toISOString()}`);
    
    // Get all ACTIVE premium subscriptions that overlap with the target month
    const activeSubscriptions = await db.subscriptionPlan.findMany({
      where: {
        name: 'Premium', // Only premium subscriptions generate revenue
        status: 'ACTIVE',
        // Subscription overlaps month if:
        // - starts before or during month AND expires after month starts
        createdAt: { lte: monthEnd },
        expiresAt: { gte: monthStart }
      },
      select: {
        userId: true,
        createdAt: true,
        expiresAt: true,
        price: true
      }
    });
    
    console.log(`📊 Found ${activeSubscriptions.length} active premium subscriptions`);
    
    // Debug: Also check total subscriptions to see if there are any
    const totalSubscriptions = await db.subscriptionPlan.count();
    const premiumSubscriptions = await db.subscriptionPlan.count({
      where: { name: 'Premium' }
    });
    const activeTotal = await db.subscriptionPlan.count({
      where: { status: 'ACTIVE' }
    });
    
    console.log(`🔍 Debug - Total subscriptions: ${totalSubscriptions}, Premium: ${premiumSubscriptions}, Active: ${activeTotal}`);
    
    let totalRevenue = 0;
    const subscriberIds = new Set<string>();
    const subscriptionDetails = [];
    
    for (const subscription of activeSubscriptions) {
      subscriberIds.add(subscription.userId);
      
      // Calculate overlap period within the target month
      const subscriptionStart = max([subscription.createdAt, monthStart]);
      const subscriptionEnd = min([subscription.expiresAt, monthEnd]);
      
      // Calculate active days in the month
      const activeDaysInMonth = differenceInDays(subscriptionEnd, subscriptionStart) + 1;
      
      // Calculate prorated revenue contribution
      const revenueContribution = (activeDaysInMonth / daysInMonth) * SUBSCRIPTION_PRICE;
      
      totalRevenue += revenueContribution;
      
      subscriptionDetails.push({
        userId: subscription.userId,
        startDate: subscriptionStart,
        endDate: subscriptionEnd,
        activeDaysInMonth,
        revenueContribution
      });
      
      console.log(`👤 User ${subscription.userId}: ${activeDaysInMonth}/${daysInMonth} days = ₦${revenueContribution.toFixed(2)}`);
    }
    
    console.log(`💰 Total Revenue: ₦${totalRevenue.toFixed(2)}`);
    console.log(`👥 Unique Subscribers: ${subscriberIds.size}`);
    
    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100, // Round to 2 decimal places
      subscriberCount: subscriberIds.size,
      subscriptions: subscriptionDetails
    };
  }
  
  /**
   * Calculate distributable revenue (70% of total)
   */
  calculateDistributableRevenue(totalRevenue: number): number {
    return Math.round(totalRevenue * EDUCATOR_REVENUE_SHARE * 100) / 100;
  }
  
  /**
   * Check if a subscription is active for a given month
   * A subscription is active if any part of its duration overlaps the month
   */
  isSubscriptionActiveForMonth(
    subscriptionStart: Date,
    subscriptionEnd: Date,
    targetMonth: Date
  ): boolean {
    const monthStart = startOfMonth(targetMonth);
    const monthEnd = endOfMonth(targetMonth);
    
    // Overlap conditions:
    // 1. Subscription starts within the month, or
    // 2. Subscription expires within the month, or  
    // 3. Subscription fully spans the month
    return subscriptionStart <= monthEnd && subscriptionEnd >= monthStart;
  }
  
  /**
   * Get all subscribers for a given month (using overlap logic)
   */
  async getSubscribersForMonth(targetMonth: Date): Promise<{
    count: number;
    userIds: string[];
  }> {
    const monthStart = startOfMonth(targetMonth);
    const monthEnd = endOfMonth(targetMonth);
    
    const activeSubscriptions = await db.subscriptionPlan.findMany({
      where: {
        name: 'Premium',
        status: 'ACTIVE',
        createdAt: { lte: monthEnd },
        expiresAt: { gte: monthStart }
      },
      select: {
        userId: true
      }
    });
    
    const userIds = [...new Set(activeSubscriptions.map(sub => sub.userId))];
    
    return {
      count: userIds.length,
      userIds
    };
  }
}