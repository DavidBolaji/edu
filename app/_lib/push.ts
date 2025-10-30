// lib/push.ts (server)
import webpush from 'web-push';
import db from '@/prisma';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'https://your-site.example.com',
  process.env.NEXT_PUBLIC_VAPID_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function sendToSubscriptions(pushEntries: { id: string, pushUrl: string }[], payload: any) {
  const results = await Promise.allSettled(pushEntries.map(async (entry) => {
    try {
      const sub = JSON.parse(entry.pushUrl);
      const resp = await webpush.sendNotification(sub, JSON.stringify(payload));
      return { id: entry.id, ok: true, resp };
    } catch (err: any) {
      // If a subscription is gone (410) or invalid, delete it
      const status = err?.statusCode || err?.status;
      if (status === 410 || status === 404) {
        await db.webPush.delete({ where: { id: entry.id } }).catch(() => {});
        return { id: entry.id, ok: false, removed: true };
      }
      return { id: entry.id, ok: false, error: err?.message || err };
    }
  }));
  return results;
}

/**
 * Get recipients by rule and send
 * recipients: e.g. { type: 'subscribers'|'course'|'all' , ids?: string[] }
 */
export async function notifyRecipients({ type, ids }: { type: string; ids?: string[] }, payload: any) {
  let pushEntries: any;
  if (type === 'all') {
    pushEntries = await db.webPush.findMany();
  } else if (type === 'subscribers' && ids) {
    pushEntries = await db.webPush.findMany({ where: { userId: { in: ids } } });
  } else if (type === 'followersOf' && ids) {
    // example: get subscribers of a user (Subscription model)
    const subs = await db.subscription.findMany({ where: { subscribedId: { in: ids } }, select: { subscriberId: true }});
    const subscriberIds = subs.map(s => s.subscriberId);
    pushEntries = await db.webPush.findMany({ where: { userId: { in: subscriberIds } } });
  } else if (type === 'course' && ids) {
    // example: course subscribers logic (depends on your data model)
    // If you had CourseSubscriptions, query them. For now: send to all users — adapt to your needs.
    pushEntries = await db.webPush.findMany();
  } else {
    pushEntries = [];
  }

  return sendToSubscriptions(pushEntries, payload);
}
