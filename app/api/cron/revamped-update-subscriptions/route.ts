import { NextRequest, NextResponse } from 'next/server'
import db from '@/prisma'
import { SubscriptionStatus } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const now = new Date()

    let expiredCount = 0
    let renewalAttempts = 0
    let successfulRenewals = 0

    /* ---------------------------------------------
     * 1. EXPIRE SUBSCRIPTIONS THAT HAVE PASSED EXPIRY
     * --------------------------------------------- */
    const expiredSubscriptions = await db.subscriptionPlan.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        expiresAt: {
          lt: now
        }
      }
    })

    for (const subscription of expiredSubscriptions) {
      await db.subscriptionPlan.update({
        where: { id: subscription.id },
        data: {
          status: SubscriptionStatus.EXPIRED,
          autoRenew: false,
          updatedAt: now
        }
      })

      await db.subscriptionHistory.create({
        data: {
          userId: subscription.userId,
          action: 'EXPIRED',
          oldStatus: SubscriptionStatus.ACTIVE,
          newStatus: SubscriptionStatus.EXPIRED,
          oldExpiryDate: subscription.expiresAt,
          newExpiryDate: subscription.expiresAt,
          reason: 'Subscription expired',
          metadata: {
            processedAt: now
          }
        }
      })

      expiredCount++
    }

    /* ---------------------------------------------
     * 2. AUTO-RENEW SUBSCRIPTIONS EXPIRING IN 24 HOURS
     * --------------------------------------------- 
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const subscriptionsForRenewal = await db.subscriptionPlan.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        autoRenew: true,
        cancelledAt: null,
        expiresAt: {
          gte: now,
          lte: tomorrow
        }
      },
      include: {
        user: {
          include: {
            wallet: true
          }
        }
      }
    })

    const monthlyPrice = 1000

    for (const subscription of subscriptionsForRenewal) {
      renewalAttempts++

      try {
        const renewalAmount = subscription.isYearly
          ? 12000
          : monthlyPrice * subscription.monthsPaid

        const walletBalance = subscription.user.wallet?.amount ?? 0

        /* ---- insufficient funds ---- 
        if (walletBalance < renewalAmount) {
          await db.subscriptionPlan.update({
            where: { id: subscription.id },
            data: {
              autoRenew: false,
              updatedAt: now
            }
          })

          await db.subscriptionHistory.create({
            data: {
              userId: subscription.userId,
              action: "FAILED",
              oldStatus: subscription.status,
              newStatus: subscription.status,
              oldExpiryDate: subscription.expiresAt,
              newExpiryDate: subscription.expiresAt,
              reason: 'Insufficient wallet balance',
              metadata: {
                requiredAmount: renewalAmount,
                availableBalance: walletBalance
              }
            }
          })

          continue
        }

        /* ---- calculate new expiry ---- 
        const newExpiryDate = new Date(subscription.expiresAt)
        if (subscription.isYearly) {
          newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1)
        } else {
          newExpiryDate.setMonth(
            newExpiryDate.getMonth() + subscription.monthsPaid
          )
        }

        /* ---- transactional renewal ---- 
        await db.$transaction(async (tx) => {
          await tx.wallet.update({
            where: { userId: subscription.userId },
            data: {
              amount: {
                decrement: renewalAmount
              }
            }
          })

          await tx.subscriptionPlan.update({
            where: { id: subscription.id },
            data: {
              expiresAt: newExpiryDate,
              lastRenewalDate: now,
              nextBillingDate: newExpiryDate,
              updatedAt: now
            }
          })

          await tx.subscriptionPayment.create({
            data: {
              userId: subscription.userId,
              subscriptionId: subscription.id,
              amount: renewalAmount,
              monthlyAmount: monthlyPrice,
              months: subscription.isYearly ? 12 : subscription.monthsPaid,
              isYearly: subscription.isYearly,
              planType: subscription.planType,
              paymentMethod: 'wallet',
              paymentStatus: 'COMPLETED',
              paymentDate: now,
              subscriptionStartDate: subscription.expiresAt,
              subscriptionEndDate: newExpiryDate,
              expirationBefore: subscription.expiresAt,
              expirationAfter: newExpiryDate,
              isRenewal: true
            }
          })

          await tx.subscriptionHistory.create({
            data: {
              userId: subscription.userId,
              action: 'RENEWED',
              oldStatus: subscription.status,
              newStatus: subscription.status,
              oldExpiryDate: subscription.expiresAt,
              newExpiryDate: newExpiryDate,
              reason: 'Auto-renewal successful',
              metadata: {
                renewalAmount,
                isYearly: subscription.isYearly
              }
            }
          })
        })

        successfulRenewals++
      } catch (error) {
        console.error(`Renewal failed for ${subscription.id}`, error)

        await db.subscriptionHistory.create({
          data: {
            userId: subscription.userId,
            action: 'FAILED',
            oldStatus: subscription.status,
            newStatus: subscription.status,
            oldExpiryDate: subscription.expiresAt,
            newExpiryDate: subscription.expiresAt,
            reason: 'Auto-renewal error',
            metadata: {
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          }
        })
      }
    }

    */

    return NextResponse.json({
      success: true,
      summary: {
        expiredSubscriptions: expiredCount,
        renewalAttempts,
        successfulRenewals,
        failedRenewals: renewalAttempts - successfulRenewals
      }
    })
  } catch (error) {
    console.error('Subscription cron error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}
