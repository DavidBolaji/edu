import { SubscriptionStatus, SubscriptionAction, PlanType, PaymentStatus, PrismaClient } from '@prisma/client';


export class EnhancedSubscriptionService {
  constructor(private prisma: PrismaClient) {}

  async createSubscriptionPlan(userId: string, planData: {
    name: string;
    price: number;
    planType: PlanType;
    months: number;
    originalPrice?: number;
    discountPercent?: number;
    maxDownloads?: number;
    maxLiveClasses?: number;
    features?: any;
    isTrialActive?: boolean;
    trialDays?: number;
  }) {
    const now = new Date();
    const expiryDate = new Date(now);
    
    // Calculate expiry based on plan type
    switch (planData.planType) {
      case 'MONTHLY':
        expiryDate.setMonth(expiryDate.getMonth() + planData.months);
        break;
    
      case 'YEARLY':
        expiryDate.setFullYear(expiryDate.getFullYear() + planData.months);
        break;
    
    }

    // Handle trial period
    let trialEndsAt = null;
    let status: SubscriptionStatus = SubscriptionStatus.ACTIVE;
    
    if (planData.isTrialActive && planData.trialDays) {
      trialEndsAt = new Date(now);
      trialEndsAt.setDate(trialEndsAt.getDate() + planData.trialDays);
      status = SubscriptionStatus.TRIAL;
    }

    const subscription = await this.prisma.subscriptionPlan.create({
      data: {
        userId,
        name: planData.name,
        price: planData.price,
        originalPrice: planData.originalPrice,
        discountPercent: planData.discountPercent,
        expiresAt: expiryDate,
        status,
        planType: planData.planType,
        maxDownloads: planData.maxDownloads,
        maxLiveClasses: planData.maxLiveClasses,
        features: planData.features,
        //@ts-ignore
        nextBillingDate: planData.planType !== 'LIFETIME' ? expiryDate : null,
        trialEndsAt,
        isTrialActive: planData.isTrialActive || false,
      }
    });

    // Log subscription creation
    await this.logSubscriptionAction(userId, SubscriptionAction.CREATED, null, status, null, expiryDate, 'Subscription plan created');

    // Initialize usage tracking
    await this.initializeUsageTracking(userId);

    return subscription;
  }

  async renewSubscription(userId: string, paymentData: {
    amount: number;
    originalAmount?: number;
    discountAmount?: number;
    paymentMethod: string;
    paymentReference?: string;
  }) {
    const subscription = await this.prisma.subscriptionPlan.findUnique({
      where: { userId }
    });

    if (!subscription) {
      throw new Error('No subscription found for user');
    }

    const now = new Date();
    const currentExpiry = subscription.expiresAt;
    const newExpiry = new Date(Math.max(currentExpiry.getTime(), now.getTime()));

    // Add renewal period based on plan type
    switch (subscription.planType) {
      case 'MONTHLY':
        newExpiry.setMonth(newExpiry.getMonth() + 1);
        break;
      case 'YEARLY':
        newExpiry.setFullYear(newExpiry.getFullYear() + 1);
        break;
    }

    // Update subscription
    const updatedSubscription = await this.prisma.subscriptionPlan.update({
      where: { userId },
      data: {
        expiresAt: newExpiry,
        status: SubscriptionStatus.ACTIVE,
        lastRenewalDate: now,
        //@ts-ignore
        nextBillingDate: subscription.planType !== 'LIFETIME' ? newExpiry : null,
        gracePeriodEnds: null,
        isTrialActive: false,
        trialEndsAt: null,
      }
    });

    // Record payment
    await this.prisma.subscriptionPayment.create({
      //@ts-ignore
      data: {
        userId,
        subscriptionId: subscription.id,
        amount: paymentData.amount,
        originalAmount: paymentData.originalAmount,
        discountAmount: paymentData.discountAmount,
        months: 1, // Adjust based on plan type
        planType: subscription.planType,
        paymentMethod: paymentData.paymentMethod,
        paymentReference: paymentData.paymentReference,
        paymentStatus: PaymentStatus.COMPLETED,
        expirationBefore: currentExpiry,
        expirationAfter: newExpiry,
        isRenewal: true,
      }
    });

    // Log renewal
    await this.logSubscriptionAction(
      userId, 
      SubscriptionAction.RENEWED, 
      subscription.status, 
      SubscriptionStatus.ACTIVE,
      currentExpiry,
      newExpiry,
      'Subscription renewed successfully'
    );

    return updatedSubscription;
  }

  async cancelSubscription(userId: string, reason?: string, immediate = false) {
    const subscription = await this.prisma.subscriptionPlan.findUnique({
      where: { userId }
    });

    if (!subscription) {
      throw new Error('No subscription found for user');
    }

    const now = new Date();
    const updateData: any = {
      autoRenew: false,
      cancelledAt: now,
      cancellationReason: reason,
    };

    let newStatus = subscription.status;
    
    if (immediate) {
      updateData.status = SubscriptionStatus.CANCELLED;
      updateData.expiresAt = now;
      newStatus = SubscriptionStatus.CANCELLED;
    }

    const updatedSubscription = await this.prisma.subscriptionPlan.update({
      where: { userId },
      data: updateData
    });

    // Log cancellation
    await this.logSubscriptionAction(
      userId,
      SubscriptionAction.CANCELLED,
      subscription.status,
      newStatus,
      subscription.expiresAt,
      immediate ? now : subscription.expiresAt,
      reason || 'User cancelled subscription'
    );

    return updatedSubscription;
  }

  async checkUsageLimits(userId: string, type: 'download' | 'liveclass'): Promise<{ allowed: boolean; used: number; limit: number | null }> {
    const subscription = await this.prisma.subscriptionPlan.findUnique({
      where: { userId }
    });

    if (!subscription || subscription.status !== SubscriptionStatus.ACTIVE) {
      return { allowed: false, used: 0, limit: null };
    }

    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const usage = await this.prisma.subscriptionUsage.findUnique({
      where: {
        userId_month: {
          userId,
          month: currentMonth
        }
      }
    });

    const used = usage ? (type === 'download' ? usage.downloadsUsed : usage.liveClassesUsed) : 0;
    const limit = type === 'download' ? subscription.maxDownloads : subscription.maxLiveClasses;

    const allowed = limit === null || used < limit;

    return { allowed, used, limit };
  }

  async incrementUsage(userId: string, type: 'download' | 'liveclass') {
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const updateData = type === 'download' 
      ? { downloadsUsed: { increment: 1 } }
      : { liveClassesUsed: { increment: 1 } };

    const createData = type === 'download'
      ? { userId, month: currentMonth, downloadsUsed: 1, liveClassesUsed: 0 }
      : { userId, month: currentMonth, downloadsUsed: 0, liveClassesUsed: 1 };

    await this.prisma.subscriptionUsage.upsert({
      where: {
        userId_month: {
          userId,
          month: currentMonth
        }
      },
      update: updateData,
      create: createData
    });
  }

  async processExpiredSubscriptions() {
    const now = new Date();
    const gracePeriodDays = 7; // 7-day grace period
    const gracePeriodEnd = new Date(now);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + gracePeriodDays);

    // Find expired subscriptions
    const expiredSubscriptions = await this.prisma.subscriptionPlan.findMany({
      where: {
        expiresAt: { lte: now },
        status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL] }
      }
    });

    for (const subscription of expiredSubscriptions) {
      if (subscription.autoRenew && subscription.status === SubscriptionStatus.ACTIVE) {
        // Try to auto-renew
        try {
          await this.attemptAutoRenewal(subscription.userId);
        } catch (error) {
          // If auto-renewal fails, set to grace period
          await this.prisma.subscriptionPlan.update({
            where: { id: subscription.id },
            data: {
              status: SubscriptionStatus.GRACE_PERIOD,
              gracePeriodEnds: gracePeriodEnd
            }
          });

          await this.logSubscriptionAction(
            subscription.userId,
            SubscriptionAction.GRACE_PERIOD_STARTED,
            subscription.status,
            SubscriptionStatus.GRACE_PERIOD,
            subscription.expiresAt,
            gracePeriodEnd,
            'Auto-renewal failed, grace period started'
          );
        }
      } else {
        // Mark as expired
        await this.prisma.subscriptionPlan.update({
          where: { id: subscription.id },
          data: { status: SubscriptionStatus.EXPIRED }
        });

        await this.logSubscriptionAction(
          subscription.userId,
          SubscriptionAction.EXPIRED,
          subscription.status,
          SubscriptionStatus.EXPIRED,
          subscription.expiresAt,
          subscription.expiresAt,
          'Subscription expired'
        );
      }
    }

    // Handle grace period expiry
    const gracePeriodExpired = await this.prisma.subscriptionPlan.findMany({
      where: {
        status: SubscriptionStatus.GRACE_PERIOD,
        gracePeriodEnds: { lte: now }
      }
    });

    for (const subscription of gracePeriodExpired) {
      await this.prisma.subscriptionPlan.update({
        where: { id: subscription.id },
        data: { status: SubscriptionStatus.EXPIRED }
      });

      await this.logSubscriptionAction(
        subscription.userId,
        SubscriptionAction.EXPIRED,
        SubscriptionStatus.GRACE_PERIOD,
        SubscriptionStatus.EXPIRED,
        subscription.gracePeriodEnds!,
        subscription.gracePeriodEnds!,
        'Grace period expired'
      );
    }
  }

  private async attemptAutoRenewal(userId: string) {
    // This would integrate with payment system
    // For now, throw error to trigger grace period
    throw new Error('Auto-renewal not implemented');
  }

  private async logSubscriptionAction(
    userId: string,
    action: SubscriptionAction,
    oldStatus: SubscriptionStatus | null,
    newStatus: SubscriptionStatus,
    oldExpiryDate: Date | null,
    newExpiryDate: Date | null,
    reason?: string,
    metadata?: any
  ) {
    await this.prisma.subscriptionHistory.create({
      data: {
        userId,
        action,
        oldStatus,
        newStatus,
        oldExpiryDate,
        newExpiryDate,
        reason,
        metadata
      }
    });
  }

  private async initializeUsageTracking(userId: string) {
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    await this.prisma.subscriptionUsage.upsert({
      where: {
        userId_month: {
          userId,
          month: currentMonth
        }
      },
      update: {},
      create: {
        userId,
        month: currentMonth,
        downloadsUsed: 0,
        liveClassesUsed: 0
      }
    });
  }
}