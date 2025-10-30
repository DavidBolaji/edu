'use client';

import { useCallAPI } from './use-call-api';

export const useCreatorActions = () => {
  const { 
    markUserOffline, 
    markUserLive,  
    createCall,
    addUserToAttendees, } = useCallAPI();

  const endCallForAll = async (getRecordingUrl: () => Promise<string>, roomId: string) => {
    // 1. Fetch recorded call (from Zego or wherever)
    // const recordingUrl = await getRecordingUrl();

    // 2. Update call record
    // await updateCallAfterRecording(roomId, recordingUrl);

    // 3. Mark users offline (backend should batch this for all users in call)
    await markUserOffline();

    // 4. Optionally navigate away
  };

  return { endCallForAll, markUserLive, createCall, addUserToAttendees };
};
