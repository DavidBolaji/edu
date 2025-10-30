'use server';

import db from '@/prisma';
import { getDetails } from '../../_services/user.services';
import { eachDayOfInterval, endOfDay, startOfMonth } from 'date-fns';

const SUBSCRIPTION_FEE = 1000;
const POINT_VALUES = {
  MEDIA_PLAY: 0.2,
  OFFLINE_DOWNLOAD: 3,
  LIVE_CLASS_ATTENDANCE: 5,
};

const getOfflineDownloads = async (
  userId: string,
  startDate: Date,
  endDate: Date
) => {
  return db.offlineDownload.count({
    where: {
      educatorId: userId,
      createdAt: { gte: startDate, lte: endDate },
    },
  });
};

const getLiveClassAttendees = async (
  userId: string,
  startDate: Date,
  endDate: Date
) => {
  const liveClasses = await db.liveClass.findMany({
    where: {
      userId: userId, // Filter by the userId of the educator
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      attendees: true, // Select the attendees array
    },
  });

  return liveClasses.reduce(
    (total, liveClass) => total + liveClass.attendees.length,
    0
  );
};

const getMediaPlays = async (
  userId: string,
  startDate: Date,
  endDate: Date
) => {
  return db.play.count({
    where: {
      educatorId: userId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      watchRatio: {
        gte: 0.3, // only count plays where at least 30% was watched
      },
    },
  });
};

const getDailyPoints = async (
  userId: string,
  startDate: Date,
  endDate: Date
) => {
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return Promise.all(
    days.map(async (day: Date) => {
      const nextDay = endOfDay(day);
      const [offlineDownloads, liveClassAttendees, mediaPlays] =
        await Promise.all([
          getOfflineDownloads(userId, day, nextDay),
          getLiveClassAttendees(userId, day, nextDay),
          getMediaPlays(userId, day, nextDay),
        ]);

      const points =
        offlineDownloads * POINT_VALUES.OFFLINE_DOWNLOAD +
        liveClassAttendees * POINT_VALUES.LIVE_CLASS_ATTENDANCE +
        mediaPlays * POINT_VALUES.MEDIA_PLAY;

      return {
        date: day.toISOString(),
        points,
      };
    })
  );
};

const getTotalUserPoints = async (startDate: Date, endDate: Date) => {
  const users = await db.user.findMany({
    where: {
      role: 'LECTURER',
    },
  });

  const usersPoints = await Promise.all(
    users.map(async (user) => {
      const [offlineDownloads, liveClasses, mediaPlays] = await Promise.all([
        getOfflineDownloads(user.id, startDate, endDate),
        getLiveClassAttendees(user.id, startDate, endDate),
        getMediaPlays(user.id, startDate, endDate),
      ]);

      return (
        offlineDownloads * POINT_VALUES.OFFLINE_DOWNLOAD +
        liveClasses * POINT_VALUES.LIVE_CLASS_ATTENDANCE +
        mediaPlays * POINT_VALUES.MEDIA_PLAY
      );
    })
  );

  return usersPoints.reduce((sum, points) => sum + points, 0);
};

const getTotalSubscriptions = async () => {
  const currentDate = new Date();
  const startOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );
  const endOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  );

  return db.subscriptionPlan.count({
    where: {
      AND: [
        {
          createdAt: {
            lte: endOfMonth,
          },
        },
        {
          expiresAt: {
            gte: startOfMonth,
          },
        },
      ],
    },
  });
};

export const getSchoolAnalyticsService = async (userId: string) => {
  const now = new Date();
  const startOfCurrentMonth = startOfMonth(now);
  console.log(userId);

  const [
    offlineDownloads,
    liveClasses,
    mediaPlays,
    dailyPoints,
    totalSchoolPoints,
    totalSubscriptions,
  ] = await Promise.all([
    getOfflineDownloads(userId, startOfCurrentMonth, now),
    getLiveClassAttendees(userId, startOfCurrentMonth, now),
    getMediaPlays(userId, startOfCurrentMonth, now),
    getDailyPoints(userId, startOfCurrentMonth, now),
    getTotalUserPoints(startOfCurrentMonth, now),
    getTotalSubscriptions(),
  ]);

  const totalPoints =
    offlineDownloads * POINT_VALUES.OFFLINE_DOWNLOAD +
    liveClasses * POINT_VALUES.LIVE_CLASS_ATTENDANCE +
    mediaPlays * POINT_VALUES.MEDIA_PLAY;

  console.log(totalPoints, totalSchoolPoints, totalSubscriptions);

  const accruedAmount =
    totalSchoolPoints > 0
      ? (totalPoints / totalSchoolPoints) *
        (0.7 * totalSubscriptions * SUBSCRIPTION_FEE)
      : 0;

  return {
    offlineDownloads,
    liveClassAttendees: liveClasses,
    mediaPlays,
    totalPoints,
    accruedAmount,
    dailyPoints,
  };
};

export const getAnalytics = async () => {
  const userId = (await getDetails()).id;
  const analytics = await getSchoolAnalyticsService(userId);
  console.log(analytics);
  return analytics;
};
