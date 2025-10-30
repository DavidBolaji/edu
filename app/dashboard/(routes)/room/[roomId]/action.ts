'use server';

import { sendPushNotification } from '@/action/action';
import { validate } from '@/app/dashboard/_services/user.services';
import { SESSION_COOKIE } from '@/config';
import db from '@/prisma';
import { cookies } from 'next/headers';

export const handleSendConferenceNotification = async (message: string) => {
  const sessionId = (await cookies()).get(SESSION_COOKIE)?.value;

  if (!sessionId) {
    throw new Error('User not authenticated');
  }

  const session = await validate(sessionId);

  try {
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { subscriptions: { select: { subscriberId: true } } },
    });

    await Promise.all(
      (user?.subscriptions || []).map(
        async (sub) =>
          await sendPushNotification(
            sub.subscriberId,
            message,
            'Class is Live',
            `/dashboard/${session.userId}`
          )
      )
    );
  } catch (error) {
    throw error;
  }
};

export const updateUser = async ({
  islive,
  code,
}: {
  islive: boolean;
  code: string | null;
}) => {
  const sessionId = (await cookies()).get(SESSION_COOKIE)?.value;

  if (!sessionId) {
    throw new Error('User not authenticated');
  }

  const session = await validate(sessionId);

  console.log(session.userId, islive, code)

  try {
    await db.user.update({
      where: { id: session.userId },
      data: { isLive: islive, code },
    });
  } catch (error) {
    throw error;
  }
};

export const createCallRecord = async (roomId: string) => {
  const sessionId = (await cookies()).get(SESSION_COOKIE)?.value;

  if (!sessionId) {
    throw new Error('User not authenticated');
  }
  console.log('[ROOMID2]', roomId);

  const session = await validate(sessionId);
  try {
    const exists = await db.liveClass.count({where: {id: roomId}})
    if(!exists) {
      await db.liveClass.create({
        data: { userId: session.userId, id: roomId },
      });
    }
  } catch (error) {
    throw error;
  }
};
export const updateCallRecord = async (
  callId: string,
  { recordingUrl }: { recordingUrl: string }
) => {
  try {
    await db.liveClass.update({
      where: { id: callId },
      data: { url: recordingUrl },
    });
  } catch (error) {
    throw error;
  }
};

export const addAttendee = async (callId: string) => {
  const sessionId = (await cookies()).get(SESSION_COOKIE)?.value;

  if (!sessionId) {
    throw new Error('User not authenticated');
  }

  const session = await validate(sessionId);
  try {
    const exists = await db.liveClassAttendee.findMany({
      where: { AND: [{ liveClassId: callId }, { userId: session.userId }] },
    });
    if (!exists.length) {
      await db.liveClassAttendee.create({
        data: { liveClassId: callId, userId: session.userId },
      });
    }
  } catch (error) {
    throw error;
  }
};
