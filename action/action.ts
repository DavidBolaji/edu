'use server';

import { validate } from '@/app/dashboard/_services/user.services';
import { SESSION_COOKIE } from '@/config';
import db from '@/prisma';
import { unstable_noStore } from 'next/cache';

import { redirect } from 'next/navigation';
import { getInjection } from '@/di/container';
import webpush from 'web-push';
import { cookies } from 'next/headers';
import { InputParseError } from '@/src/entities/error/common';

// import webpush from 'web-push'
webpush.setVapidDetails(
  'https://edutainment.com',
  process.env.NEXT_PUBLIC_VAPID_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function sendNotification(message: string) {
  try {
    await webpush.sendNotification(
      JSON.parse(""),
      JSON.stringify({
        title: "Test Notification",
        body: message,
        url: "/dashboard/home",
        icon: "/icon.png",
      })
    );
    return { success: true };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { success: false, error: 'Failed to send notification' };
  }
}

export const handleNotification = async (subscription: PushSubscription) => {
  const sessionId = (await cookies()).get(SESSION_COOKIE)?.value;
  try {
    const subscribeToPushNotificationController = getInjection(
      'ISubscribeToPushNotificationController'
    );
    const sub = await subscribeToPushNotificationController({
      subscription,
      sessionId,
    });
    return sub;
  } catch (error) {
    throw error;
  }
};

export const reload = (path: string) => {
  unstable_noStore();
  redirect(path);
};

export async function sendPushNotification(
  userId: string | undefined,
  message: string,
  name: string,
  url: string = '/dashboard/home'
) {
  const sessionId = (await cookies()).get(SESSION_COOKIE)?.value;

  try {
    const sendPushController = getInjection('ISendPushController');
    await sendPushController(userId, message, name, url, sessionId);
  } catch (err) {
    if (err instanceof InputParseError) {
      console.log(err);
      throw err;
    }
    console.log((err as Error).message);
    return {};
  }
}

export const updatePic = async (imgUrl: string) => {
  const sessionId = (await cookies()).get(SESSION_COOKIE)?.value;

  if (!sessionId) {
    throw new Error('User not authenticated');
  }

  const session = await validate(sessionId);

  try {
    await db.user.update({
      where: { id: session.userId },
      data: {
        picture: imgUrl,
      },
    });
    return { success: true };
  } catch (error) {
    return { success: false };
  }
};
