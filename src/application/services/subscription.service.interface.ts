export interface ISubscriptionService {
  sendPushNotification(
    subscription: any,
    message: string,
    name: string,
    url: string
  ): Promise<void>;
}
