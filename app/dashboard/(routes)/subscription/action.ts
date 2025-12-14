'use server';

import db from '@/prisma';

export const createSubscriptionPlan = async (data: any) => {
  const { name, price, months, userId } = data;
  
  // Get existing subscription
  const existingSubscription = await db.subscriptionPlan.findUnique({
    where: { userId: userId }
  });

  // Calculate proper expiration date
  const now = new Date();
  let newExpirationDate: Date;
  
  if (existingSubscription && existingSubscription.expiresAt > now) {
    // Extend from current expiration if still active
    newExpirationDate = new Date(existingSubscription.expiresAt);
    newExpirationDate.setMonth(newExpirationDate.getMonth() + months);
  } else {
    // Start from now if no subscription or expired
    newExpirationDate = new Date(now);
    newExpirationDate.setMonth(newExpirationDate.getMonth() + months);
  }

  let subscription;
  if (existingSubscription) {
    // Update existing subscription
    subscription = await db.subscriptionPlan.update({
      where: { id: existingSubscription.id },
      data: {
        name,
        price,
        expiresAt: newExpirationDate,
        status: 'ACTIVE',
        updatedAt: now
      },
    });
  } else {
    // Create new subscription
    subscription = await db.subscriptionPlan.create({
      data: {
        name,
        price,
        expiresAt: newExpirationDate,
        status: 'ACTIVE',
        userId: userId,
      },
    });
  }

  // Record the payment history
  await db.subscriptionPayment.create({
    //@ts-ignore
    data: {
      userId,
      subscriptionId: subscription.id,
      amount: price,
      months,
      paymentDate: now,
      expirationBefore: existingSubscription?.expiresAt || null,
      expirationAfter: newExpirationDate
    }
  });

  return subscription;
};

export const createTransaction = async (data: any) => {
  const { amount, type, status, message, userId } = data;

  const action = type === 'TOPUP' ? 'increment' : 'decrement';
  const wallet = await db.wallet.findUnique({
    where: { userId },
  });

  if (!wallet) {
    await db.wallet.create({
      data: {
        userId,
        amount: +amount,
      },
    });
  } else {
    await db.wallet.update({
      where: { id: wallet.id },
      data: {
        amount: {
          [action]: +amount,
        },
      },
    });
  }

  const transaction = await db.transaction.create({
    data: {
      userId,
      amount: +amount,
      type,
      status,
      message,
    },
  });
  return transaction;
};
