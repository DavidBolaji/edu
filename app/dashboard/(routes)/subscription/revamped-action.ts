'use server';

import { PlanType, SubscriptionStatus, PaymentStatus, SubscriptionAction } from '@prisma/client';
import db from '@/prisma';
import { revalidatePath } from 'next/cache';

const MONTHLY_PRICE = 1000;
const YEARLY_PRICE = 12000;

interface CreateRevampedSubscriptionData {
  userId: string;
  planType: 'free' | 'premium';
  isYearly: boolean;
  months: number;
  paymentMethod: 'wallet' | 'paystack';
}

interface CancelRevampedSubscriptionData {
  userId: string;
  reason: string;
}

export async function createRevampedSubscription(data: CreateRevampedSubscriptionData) {
  try {
    const { userId, planType, isYearly, months, paymentMethod } = data;

    // Validate input
    if (planType === 'free') {
      throw new Error('Cannot create payment for free plan');
    }

    if (months < 1 || months > 12) {
      throw new Error('Months must be between 1 and 12');
    }

    // Calculate pricing
    const monthlyRate = MONTHLY_PRICE;
    let totalAmount: number;
    
    if (isYearly) {
      totalAmount = YEARLY_PRICE;
    } else {
      totalAmount = monthlyRate * months;
    }

    // Check wallet balance if using wallet payment
    if (paymentMethod === 'wallet') {
      const wallet = await db.wallet.findUnique({
        where: { userId }
      });

      if (!wallet || wallet.amount < totalAmount) {
        throw new Error('Insufficient wallet balance');
      }
    }

    // Get existing subscription
    const existingSubscription = await db.subscriptionPlan.findUnique({
      where: { userId }
    });

    const now = new Date();
    let subscriptionStartDate = now;
    let subscriptionEndDate = new Date(now);

    // Calculate subscription period
    if (existingSubscription && existingSubscription.expiresAt > now && existingSubscription.status === SubscriptionStatus.ACTIVE) {
      // If subscription was cancelled but still active, start from now for reactivation
      if (existingSubscription.cancelledAt) {
        subscriptionStartDate = now;
        subscriptionEndDate = new Date(now);
      } else {
        // Extend from current expiration if still active and not cancelled
        subscriptionStartDate = existingSubscription.expiresAt;
        subscriptionEndDate = new Date(existingSubscription.expiresAt);
      }
    }

    if (isYearly) {
      subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
    } else {
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + months);
    }

    // Calculate revenue allocation for mid-month subscriptions
    const { currentMonthRevenue, nextMonthRevenue, revenueRatio } = calculateRevenueAllocation(
      subscriptionStartDate,
      subscriptionEndDate,
      totalAmount,
      monthlyRate
    );

    // Start transaction
    const result = await db.$transaction(async (tx) => {
      // Deduct from wallet if using wallet payment
      if (paymentMethod === 'wallet') {
        await tx.wallet.update({
          where: { userId },
          data: {
            amount: {
              decrement: totalAmount
            }
          }
        });
      }

      // Create or update subscription plan
      let subscription;
      const isReactivation = existingSubscription?.cancelledAt !== null;
      
      if (existingSubscription) {
        subscription = await tx.subscriptionPlan.update({
          where: { id: existingSubscription.id },
          data: {
            name: 'Premium',
            price: monthlyRate,
            expiresAt: subscriptionEndDate,
            status: SubscriptionStatus.ACTIVE,
            isYearly,
            monthsPaid: months,
            planType: isYearly ? PlanType.YEARLY : PlanType.MONTHLY,
            maxDownloads: null, // Unlimited for premium
            maxLiveClasses: null, // Unlimited for premium
            autoRenew: true,
            lastRenewalDate: now,
            nextBillingDate: subscriptionEndDate,
            cancelledAt: null,
            cancellationReason: null,
            updatedAt: now
          }
        });
      } else {
        subscription = await tx.subscriptionPlan.create({
          data: {
            userId,
            name: 'Premium',
            price: monthlyRate,
            expiresAt: subscriptionEndDate,
            status: SubscriptionStatus.ACTIVE,
            isYearly,
            monthsPaid: months,
            planType: isYearly ? PlanType.YEARLY : PlanType.MONTHLY,
            maxDownloads: null, // Unlimited for premium
            maxLiveClasses: null, // Unlimited for premium
            autoRenew: true,
            lastRenewalDate: now,
            nextBillingDate: subscriptionEndDate
          }
        });
      }

      // Record payment
      await tx.subscriptionPayment.create({
        data: {
          userId,
          subscriptionId: subscription.id,
          amount: totalAmount,
          monthlyAmount: monthlyRate,
          months,
          isYearly,
          planType: isYearly ? PlanType.YEARLY : PlanType.MONTHLY,
          paymentMethod,
          paymentStatus: PaymentStatus.COMPLETED,
          paymentDate: now,
          subscriptionStartDate,
          subscriptionEndDate,
          expirationBefore: existingSubscription?.expiresAt || null,
          expirationAfter: subscriptionEndDate,
          isRenewal: !!existingSubscription,
          currentMonthRevenue,
          nextMonthRevenue,
          revenueRatio
        }
      });

      // Record subscription history
      let action = 'CREATED' as SubscriptionAction;
      let reason = `${planType} subscription created for ${months} month(s)`;
      
      if (existingSubscription) {
        if (isReactivation) {
          action = 'REACTIVATED';
          reason = `${planType} subscription reactivated for ${months} month(s)`;
        } else {
          action = 'RENEWED';
          reason = `${planType} subscription renewed for ${months} month(s)`;
        }
      }

      await tx.subscriptionHistory.create({
        data: {
          userId,
          action,
          oldStatus: existingSubscription?.status || null,
          newStatus: SubscriptionStatus.ACTIVE,
          oldExpiryDate: existingSubscription?.expiresAt || null,
          newExpiryDate: subscriptionEndDate,
          reason,
          metadata: {
            paymentMethod,
            amount: totalAmount,
            isYearly,
            months,
            isReactivation
          }
        }
      });

      return subscription;
    });

    revalidatePath('/dashboard/subscription');
    return { success: true, subscription: result };

  } catch (error) {
    console.error('Create subscription error:', error);
    throw error;
  }
}

export async function downgradeToFree(userId: string) {
  try {
    const subscription = await db.subscriptionPlan.findUnique({
      where: { userId }
    });

    if (!subscription) {
      throw new Error('No subscription found');
    }

    if (subscription.name === 'Free') {
      throw new Error('Already on free plan');
    }

    const now = new Date();

    // Cancel current subscription and mark for downgrade
    const updatedSubscription = await db.subscriptionPlan.update({
      where: { id: subscription.id },
      data: {
        autoRenew: false,
        cancelledAt: now,
        cancellationReason: 'Downgraded to free plan',
        updatedAt: now
      }
    });

    // Record subscription history
    await db.subscriptionHistory.create({
      data: {
        userId,
        action: 'DOWNGRADED',
        oldStatus: subscription.status,
        newStatus: subscription.status, // Still active until expiry
        oldExpiryDate: subscription.expiresAt,
        newExpiryDate: subscription.expiresAt,
        reason: 'User downgraded to free plan',
        metadata: {
          cancelledAt: now,
          willExpireAt: subscription.expiresAt,
          downgradedFrom: subscription.name
        }
      }
    });

    revalidatePath('/dashboard/subscription');
    return { success: true, subscription: updatedSubscription };

  } catch (error) {
    console.error('Downgrade to free error:', error);
    throw error;
  }
}

export async function cancelRevampedSubscription(data: CancelRevampedSubscriptionData) {
  try {
    const { userId, reason } = data;

    const subscription = await db.subscriptionPlan.findUnique({
      where: { userId }
    });

    if (!subscription) {
      throw new Error('No active subscription found');
    }

    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new Error('Subscription is not active');
    }

    const now = new Date();

    // Update subscription to cancelled but keep it active until expiry
    const updatedSubscription = await db.subscriptionPlan.update({
      where: { id: subscription.id },
      data: {
        autoRenew: false,
        cancelledAt: now,
        cancellationReason: reason,
        updatedAt: now
      }
    });

    // Record subscription history
    await db.subscriptionHistory.create({
      data: {
        userId,
        action: 'CANCELLED',
        oldStatus: SubscriptionStatus.ACTIVE,
        newStatus: SubscriptionStatus.ACTIVE, // Still active until expiry
        oldExpiryDate: subscription.expiresAt,
        newExpiryDate: subscription.expiresAt,
        reason,
        metadata: {
          cancelledAt: now,
          willExpireAt: subscription.expiresAt
        }
      }
    });

    revalidatePath('/dashboard/subscription');
    return { success: true, subscription: updatedSubscription };

  } catch (error) {
    console.error('Cancel subscription error:', error);
    throw error;
  }
}

export async function getRevampedSubscriptionDetails(userId: string) {
  try {
    const [subscriptionPlan, subscriptionUsage, wallet] = await Promise.all([
      db.subscriptionPlan.findUnique({
        where: { userId }
      }),
      db.subscriptionUsage.findFirst({
        where: {
          userId,
          month: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      db.wallet.findUnique({
        where: { userId }
      })
    ]);

    return {
      success: true,
      subscriptionPlan,
      subscriptionUsage,
      wallet
    };

  } catch (error) {
    console.error('Get subscription details error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Helper function to calculate revenue allocation for mid-month subscriptions
function calculateRevenueAllocation(
  startDate: Date,
  endDate: Date,
  totalAmount: number,
  monthlyRate: number
): {
  currentMonthRevenue: number | null;
  nextMonthRevenue: number | null;
  revenueRatio: number | null;
} {
  const startMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  
  // If subscription spans only one month or starts at beginning of month
  if (startMonth.getTime() === endMonth.getTime() || startDate.getDate() === 1) {
    return {
      currentMonthRevenue: null,
      nextMonthRevenue: null,
      revenueRatio: null
    };
  }

  // Calculate days in current month and days remaining
  const daysInCurrentMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
  const daysRemainingInCurrentMonth = daysInCurrentMonth - startDate.getDate() + 1;
  
  // Calculate ratio for current month (how much of the month is covered)
  const ratio = daysRemainingInCurrentMonth / daysInCurrentMonth;
  
  // Allocate revenue proportionally
  const currentMonthRevenue = monthlyRate * ratio;
  const nextMonthRevenue = monthlyRate * (1 - ratio);

  return {
    currentMonthRevenue,
    nextMonthRevenue,
    revenueRatio: ratio
  };
}