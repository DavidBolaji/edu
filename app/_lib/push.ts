// lib/push.ts (server)

import webpush from "web-push";
import db from "@/prisma";
import { chunk } from "lodash";

// Configure VAPID keys
// Use mailto: format for better compatibility
webpush.setVapidDetails(
  "mailto:odavidbolaji14@gmail.com", 
  process.env.NEXT_PUBLIC_VAPID_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

const BATCH_SIZE = 30;

export async function sendToSubscriptions(
  pushEntries: { id: string; userId: string; pushUrl: string }[],
  payload: any
) {
  // Flatten the payload structure to match what service worker expects
  const formattedPayload = {
    title: payload.title || "Notification",
    body: payload.body || "You have a new message",
    icon: payload.icon || "/icons/icon-192x192.png",
    url: payload.url || "/",
  };

  console.log("📤 Sending push notification:", formattedPayload);

  const results = await Promise.allSettled(
    pushEntries.map(async (entry) => {
      try {
        const sub = JSON.parse(entry.pushUrl);
        const resp = await webpush.sendNotification(
          sub,
          JSON.stringify(formattedPayload)
        );
        console.log(`✅ Sent to user ${entry.userId}:`, resp.statusCode);
        return { id: entry.id, ok: true, resp };
      } catch (err: any) {
        const status = err?.statusCode || err?.status;
        console.error(`❌ Failed to send to user ${entry.userId}:`, {
          status,
          message: err?.message,
          body: err?.body,
        });
        
        // Remove invalid subscriptions (expired or unsubscribed)
        if (status === 410 || status === 404) {
          await db.webPush.delete({ where: { id: entry.id } }).catch(() => {});
          return { id: entry.id, ok: false, removed: true };
        }
        return { id: entry.id, ok: false, error: err?.message || err };
      }
    })
  );

  const successful = results.filter(
    (r) => r.status === "fulfilled" && r.value.ok
  ).length;
  const failed = results.length - successful;
  
  console.log(`📊 Push notification results: ${successful} sent, ${failed} failed`);

  return results;
}

export async function notifyRecipients(
  {
    type,
    ids,
    excludeId,
  }: { 
    type: "all" | "followersOf" | "subscribers" | "self"; 
    ids?: string[]; 
    excludeId?: string 
  },
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

  console.log(`📮 Notifying ${pushEntries.length} recipients (type: ${type})`);

  if (!pushEntries.length) {
    console.log("⚠️ No recipients found for notification");
    return [];
  }

  const batches = chunk(pushEntries, BATCH_SIZE);
  const results = [];
  
  for (const batch of batches) {
    const batchResult = await sendToSubscriptions(batch, payload);
    results.push(...batchResult);
  }

  return results;
}