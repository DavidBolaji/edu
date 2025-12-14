import db from '@/prisma';

export class SubscriptionStatusService {
  
  /**
   * Update expired subscriptions to EXPIRED status
   * Should be run daily or before revenue calculations
   */
  async updateExpiredSubscriptions(): Promise<number> {
    const now = new Date();
    
    const result = await db.subscriptionPlan.updateMany({
      where: {
        expiresAt: { lt: now },
        status: 'ACTIVE'
      },
      data: {
        status: 'EXPIRED'
      }
    });

    console.log(`Updated ${result.count} expired subscriptions`);
    return result.count;
  }

  /**
   * Get subscription status for a user
   */
  async getUserSubscriptionStatus(userId: string) {
    const subscription = await db.subscriptionPlan.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            fname: true,
            lname: true,
            email: true
          }
        }
      }
    });

    if (!subscription) {
      return {
        hasSubscription: false,
        status: 'NONE',
        daysRemaining: 0,
        isActive: false
      };
    }

    const now = new Date();
    const daysRemaining = Math.max(0, Math.ceil(
      (subscription.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    ));

    const isActive = subscription.expiresAt > now && subscription.status === 'ACTIVE';

    return {
      hasSubscription: true,
      subscription,
      status: subscription.status,
      daysRemaining,
      isActive,
      expiresAt: subscription.expiresAt,
      price: subscription.price
    };
  }

  /**
   * Get subscription payment history for a user
   */
  async getUserPaymentHistory(userId: string) {
    return db.subscriptionPayment.findMany({
      where: { userId },
      orderBy: { paymentDate: 'desc' },
      take: 10
    });
  }

  /**
   * Get revenue statistics for a specific month
   */
  async getMonthlyRevenueStats(month: Date) {
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    const [paymentsThisMonth, activeSubscriptions, totalRevenue] = await Promise.all([
      db.subscriptionPayment.count({
        where: {
          paymentDate: { gte: monthStart, lte: monthEnd }
        }
      }),
      db.subscriptionPlan.count({
        where: {
          AND: [
            { createdAt: { lte: monthEnd } },
            { expiresAt: { gte: monthStart } },
            { status: 'ACTIVE' }
          ]
        }
      }),
      db.subscriptionPayment.aggregate({
        where: {
          paymentDate: { gte: monthStart, lte: monthEnd }
        },
        _sum: {
          amount: true
        }
      })
    ]);

    return {
      month: monthStart,
      paymentsCount: paymentsThisMonth,
      activeSubscriptions,
      totalRevenue: totalRevenue._sum.amount || 0,
      educatorShare: (totalRevenue._sum.amount || 0) * 0.7
    };
  }
}