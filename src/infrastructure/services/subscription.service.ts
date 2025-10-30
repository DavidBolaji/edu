import { ISubscriptionService } from '@/src/application/services/subscription.service.interface';
import { WebPush } from '@prisma/client';
import webpush from 'web-push';

export class SubscriptionService implements ISubscriptionService {
  public _publicKey: string;
  private _privateKey: string;
  private _isDev = process.env.NEXT_PUBLIC_ENV === 'dev';
  private _url: string | undefined;

  constructor() {
    this._publicKey = process.env.NEXT_PUBLIC_VAPID_KEY!;
    this._privateKey = process.env.VAPID_PRIVATE_KEY!;
    this._url = this._isDev
      ? `mailto:${process.env.NEXT_PUBLIC_FRONT_DEV}`
      : process.env.NEXT_PUBLIC_FRONT_PROD;

    if (!this._privateKey || !this._publicKey) {
      throw new Error('Key for push notification is not configured properly.');
    }
    if (!this._url) {
      throw new Error('URL for push notification is not configured properly.');
    }

    webpush.setVapidDetails(this._url, this._publicKey, this._privateKey);
  }

  async sendPushNotification(
    subscriptions: Pick<WebPush, 'pushUrl'>[],
    message: string,
    name: string,
    url: string
  ): Promise<any> {
    try {
      const pushAll = subscriptions.map(async (subscription) => {
        try {
          const payload = JSON.parse(subscription.pushUrl);

          const res = await webpush.sendNotification(
            payload,
            JSON.stringify({
              title: name,
              icon: '',
              body: message,
              url,
            })
          );

          return { status: 'fulfilled', value: res };
        } catch (error) {
          return { status: 'rejected', reason: error };
        }
      });

      const results = await Promise.allSettled(pushAll);
      // console.log('PUSH_RESULT', JSON.stringify(results, null, 2));
      return results;
    } catch (error) {
      throw error;
    }
  }
}
