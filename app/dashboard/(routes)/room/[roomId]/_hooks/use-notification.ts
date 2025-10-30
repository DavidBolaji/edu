'use client';

import { handleSendConferenceNotification } from '../action';

export const useNotifications = () => {
  const notifySubscribersCreatorLive = (creatorName: string) => {
    return handleSendConferenceNotification(
      `🔴 ${creatorName} is LIVE! Join now.`
    );
  };

  return { notifySubscribersCreatorLive };
};
