// lib/push.ts (server)
import webpush from "web-push";
import db from "@/prisma";
import { chunk } from "lodash";

// Configure VAPID keys
webpush.setVapidDetails(
  "https://edu-ivory.vercel.app",
  process.env.NEXT_PUBLIC_VAPID_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

const BATCH_SIZE = 30;

/**
 * Send notifications to a batch of subscriptions
 */
export async function sendToSubscriptions(
  pushEntries: { id: string; userId: string; pushUrl: string }[],
  payload: any
) {
  const results = await Promise.allSettled(
    pushEntries.map(async (entry) => {
      try {
        const sub = JSON.parse(entry.pushUrl);
        const resp = await webpush.sendNotification(sub, JSON.stringify(payload));
        return { id: entry.id, ok: true, resp };
      } catch (err: any) {
        const status = err?.statusCode || err?.status;
        // Remove dead or expired subscriptions
        if (status === 410 || status === 404) {
          await db.webPush.delete({ where: { id: entry.id } }).catch(() => {});
          return { id: entry.id, ok: false, removed: true };
        }
        return { id: entry.id, ok: false, error: err?.message || err };
      }
    })
  );

  return results;
}

/**
 * Notify recipients based on rule type
 *
 * Supported types:
 *  - "all" → all users
 *  - "followersOf" → followers of specific users
 *  - "subscribers" → custom list of users
 *  - "self" → the current user only
 *
 * Optional:
 *  - excludeId → exclude sender or specific user
 */
export async function notifyRecipients(
  {
    type,
    ids,
    excludeId,
  }: { type: "all" | "followersOf" | "subscribers" | "self"; ids?: string[]; excludeId?: string },
  payload: any
) {
  let pushEntries: { id: string; userId: string; pushUrl: string }[] = [];

  switch (type) {
    case "all":
      pushEntries = await db.webPush.findMany({
        where: excludeId ? { userId: { not: excludeId } } : undefined,
        select: { id: true, userId: true, pushUrl: true },
      });
      break;

    case "followersOf":
      if (!ids?.length) break;
      const subs = await db.subscription.findMany({
        where: { subscribedId: { in: ids } },
        select: { subscriberId: true },
      });
      const followerIds = subs.map((s) => s.subscriberId);
      pushEntries = await db.webPush.findMany({
        where: { userId: { in: followerIds } },
        select: { id: true, userId: true, pushUrl: true },
      });
      break;

    case "subscribers":
      if (ids?.length) {
        pushEntries = await db.webPush.findMany({
          where: { userId: { in: ids } },
          select: { id: true, userId: true, pushUrl: true },
        });
      }
      break;

    case "self":
      if (ids?.length === 1) {
        pushEntries = await db.webPush.findMany({
          where: { userId: ids[0] },
          select: { id: true, userId: true, pushUrl: true },
        });
      }
      break;

    default:
      pushEntries = [];
  }

  if (!pushEntries.length) return [];

  // Send in manageable batches
  const batches = chunk(pushEntries, BATCH_SIZE);
  const results = [];
  for (const batch of batches) {
    const batchResult = await sendToSubscriptions(batch, payload);
    results.push(...batchResult);
  }

  return results;
}
