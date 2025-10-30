export interface ISubscribeRepository {
  subscribeToUser(authUser: string, userId: string): Promise<void>;
}
