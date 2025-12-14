'use server';

import { PlanType, SubscriptionStatus } from '@prisma/client';
import db from '@/prisma';
import { EnhancedSubscriptionService } from '@/src/application/services/enhanced-subscription.service';
import { revalidatePath } from 'next/cache';


const subscriptionService = new EnhancedSubscriptionService(db);

export async function createEnhancedSubscription(data: {
  userId: string;
  planId: string;
  paymentMethod: string;
  paymentReference?: string;
}) {
  try {
    const planConfigs = {
      basic: {
        name: 'Basic Plan',
        price: 1000,
        originalPrice: 1200,
        planType: 'MONTHLY' as PlanType,
        months: 1,
        maxDownloads: 50,
        maxLiveClasses: 10,
        features: {
          downloads: 50,
          liveClasses: 10,
          support: 'priority',
          offline: true
        }
      },
      premium: {
        name: 'Premium Plan',
        price: 2500,
        originalPrice: 3000,
        planType: 'MONTHLY' as PlanType,
        months: 1,
        maxDownloads: null,
        maxLiveClasses: null,
        features: {
          downloads: 'unlimited',
          liveClasses: 'unlimited',
          support: '24/7',
          analytics: true,
          earlyAccess: true
        }
      },
      yearly: {
        name: 'Yearly Premium',
        price: 25000,
        originalPrice: 36000,
        planType: 'YEARLY' as PlanType,
        months: 12,
        maxDownloads: null,
        maxLiveClasses: null,
        features: {
          downloads: 'unlimited',
          liveClasses: 'unlimited',
          support: 'priority-success',
          customIntegrations: true,
          twoMonthsFree: true
        }
      }
    };

    const planConfig = planConfigs[data.planId as keyof typeof planConfigs];
    if (!planConfig) {
      throw new Error('Invalid plan selected');
    }

    // Check if user has sufficient wallet balance
    const user = await db.user.findUnique({
      where: { id: data.userId },
      include: { wallet: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const walletBalance = user.wallet?.amount || 0;
    if (walletBalance < planConfig.price) {
      throw new Error('Insufficient wallet balance');
    }

    // Check if user already has an active subscription
    const existingSubscription = await db.subscriptionPlan.findUnique({
      where: { userId: data.userId }
    });

    if (existingSubscription && existingSubscription.status === SubscriptionStatus.ACTIVE) {
      throw new Error('User already has an active subscription');
    }

    // Create or update subscription
    const subscription = await subscriptionService.createSubscriptionPlan(data.userId, {
      name: planConfig.name,
      price: planConfig.price,
      planType: planConfig.planType,
      months: planConfig.months,
      originalPrice: planConfig.originalPrice,
      discountPercent: planConfig.originalPrice ? 
        Math.round(((planConfig.originalPrice - planConfig.price) / planConfig.originalPrice) * 100) : 0,
      maxDownloads: planConfig.maxDownloads ?? undefined,
      maxLiveClasses: planConfig.maxLiveClasses ?? undefined,
      features: planConfig.features
    });

    // Deduct from wallet
    await db.wallet.update({
      where: { userId: data.userId },
      data: { amount: { decrement: planConfig.price } }
    });

    // Create transaction record
    await db.transaction.create({
      data: {
        userId: data.userId,
        amount: planConfig.price,
        message: `Subscription: ${planConfig.name}`,
        type: 'SUBSCRIPTION',
        status: 'PAID'
      }
    });

    revalidatePath('/dashboard/subscription');
    return { success: true, subscription };

  } catch (error) {
    console.error('Enhanced subscription error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to create subscription');
  }
}

export async function startTrialSubscription(data: {
  userId: string;
  trialDays: number;
}) {
  try {
    const subscription = await subscriptionService.createSubscriptionPlan(data.userId, {
      name: 'Premium Trial',
      price: 0,
      planType: 'MONTHLY',
      months: 1,
      maxDownloads: undefined,
      maxLiveClasses: undefined,
      features: {
        downloads: 'unlimited',
        liveClasses: 'unlimited',
        support: '24/7',
        trial: true
      },
      isTrialActive: true,
      trialDays: data.trialDays
    });

    revalidatePath('/dashboard/subscription');
    return { success: true, subscription };

  } catch (error) {
    console.error('Trial subscription error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to start trial');
  }
}

export async function cancelSubscription(data: {
  userId: string;
  reason?: string;
  immediate?: boolean;
}) {
  try {
    const subscription = await subscriptionService.cancelSubscription(
      data.userId, 
      data.reason, 
      data.immediate
    );

    revalidatePath('/dashboard/subscription');
    return { success: true, subscription };

  } catch (error) {
    console.error('Cancel subscription error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to cancel subscription');
  }
}

export async function renewSubscription(data: {
  userId: string;
  paymentMethod: string;
  paymentReference?: string;
}) {
  try {
    const user = await db.user.findUnique({
      where: { id: data.userId },
      include: { 
        wallet: true,
        subscriptionPlan: true
      }
    });

    if (!user?.subscriptionPlan) {
      throw new Error('No subscription found to renew');
    }

    const walletBalance = user.wallet?.amount || 0;
    if (walletBalance < user.subscriptionPlan.price) {
      throw new Error('Insufficient wallet balance for renewal');
    }

    const subscription = await subscriptionService.renewSubscription(data.userId, {
      amount: user.subscriptionPlan.price,
      paymentMethod: data.paymentMethod,
      paymentReference: data.paymentReference
    });

    // Deduct from wallet
    await db.wallet.update({
      where: { userId: data.userId },
      data: { amount: { decrement: user.subscriptionPlan.price } }
    });

    revalidatePath('/dashboard/subscription');
    return { success: true, subscription };

  } catch (error) {
    console.error('Renew subscription error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to renew subscription');
  }
}

export async function checkUsageLimits(data: {
  userId: string;
  type: 'download' | 'liveclass';
}) {
  try {
    const result = await subscriptionService.checkUsageLimits(data.userId, data.type);
    return { success: true, ...result };

  } catch (error) {
    console.error('Check usage limits error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to check usage limits');
  }
}

export async function incrementUsage(data: {
  userId: string;
  type: 'download' | 'liveclass';
}) {
  try {
    await subscriptionService.incrementUsage(data.userId, data.type);
    revalidatePath('/dashboard/subscription');
    return { success: true };

  } catch (error) {
    console.error('Increment usage error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to increment usage');
  }
}

export async function getSubscriptionDetails(userId: string) {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        subscriptionPlan: true,
        subscriptionUsage: {
          where: {
            month: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          },
          orderBy: { month: 'desc' },
          take: 1
        },
        subscriptionHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        wallet: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      success: true,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionUsage: user.subscriptionUsage[0] || null,
      subscriptionHistory: user.subscriptionHistory,
      wallet: user.wallet
    };

  } catch (error) {
    console.error('Get subscription details error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to get subscription details');
  }
}