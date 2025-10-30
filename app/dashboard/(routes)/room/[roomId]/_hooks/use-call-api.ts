'use client';

import {
  addAttendee,
  createCallRecord,
  updateCallRecord,
  updateUser,
} from '../action';

export const useCallAPI = () => {
  const markUserLive = (roomId: string) => {
    return updateUser({ islive: true, code: roomId });
  };

  const markUserOffline = () => {
    return updateUser({ islive: false, code: null });
  };

  const createCall = (roomId: string) => {
    return createCallRecord(roomId);
  };

  // const updateCallAfterRecording = (callId: string, recordingUrl: string) => {
  //   return updateCallRecord(callId, { recordingUrl });
  // };

  const addUserToAttendees = (callId: string) => {
    return addAttendee(callId);
  };

  return {
    markUserLive,
    markUserOffline,
    createCall,
    addUserToAttendees,
  };
};
