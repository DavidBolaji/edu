import { UserDetail } from '@/src/entities/models/user';
import { useCallAPI } from './use-call-api';
import { useNotifications } from './use-notification';

const callTimestamps: Record<string, number> = {};

export const useRoomSetup = () => {
  const { markUserLive, createCall, addUserToAttendees } = useCallAPI();
  const { notifySubscribersCreatorLive } = useNotifications();

  const setupRoom = async (
    user: UserDetail,
    roomId: string,
    isCreator: boolean
  ) => {
    const key = `${user.id}_${roomId}`;
    const now = Date.now();

    // If this room was already set up within 10 seconds, skip
    if (callTimestamps[key] && now - callTimestamps[key] < 10_000) {
      console.log('setupRoom throttled for', key);
      return;
    }

    callTimestamps[key] = now;

    if (isCreator) {
      await markUserLive(roomId);
      await createCall(roomId);
      await notifySubscribersCreatorLive(`${user.fname} ${user.lname}`);
    } else {
      await addUserToAttendees(roomId);
    }
  };

  return { setupRoom };
};
