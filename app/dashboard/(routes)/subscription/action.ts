'use server';

import db from '@/prisma';

export const createSubscriptionPlan = async (data: any) => {
  const { name, price, expiresAt, userId } = data;
  const subscriptionPlan = await db.subscriptionPlan.findUnique({
    where: {
      userId: userId,
    },
  });

  let subscription;
  if (subscriptionPlan) {
    subscription = await db.subscriptionPlan.update({
      where: { id: subscriptionPlan.id },
      data: {
        price,
        expiresAt,
      },
    });
  } else {
    subscription = await db.subscriptionPlan.create({
      data: {
        name,
        price,
        expiresAt,
        userId: userId,
      },
    });
  }
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
