'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ZegoUIKitPrebuilt, ZegoUser } from '@zegocloud/zego-uikit-prebuilt';
import { v4 as uuid } from 'uuid';
import { getDetails } from '@/app/dashboard/_services/user.services';
import { useParams, useSearchParams } from 'next/navigation';
import { UserDetail } from '@/src/entities/models/user';
import { useRoomSetup } from './_hooks/use-room-setup';

const RoomPage = () => {
  const { roomId } = useParams();
  const { get } = useSearchParams();

  const containerRef = useRef<HTMLDivElement>(null);
  const [, setUser] = useState<UserDetail | null>(null);
  const [isCreator, setIsCreator] = useState(false);

  const { setupRoom } = useRoomSetup();

  useEffect(() => {
    const initRoom = async () => {
      const creator = Boolean(get('creator') || 0);
      const user = await getDetails();
  
      const [creatorId, roomID] = (roomId as string).split('_');

      setUser(user);

      const isCurrentCreator = creator;
      setIsCreator(isCurrentCreator);

      await setupRoom(user, roomID, isCurrentCreator);

      const appID = parseInt(process.env.NEXT_PUBLIC_ZEGO_APP_ID!);
      const serverSecret = process.env.NEXT_PUBLIC_ZEGO_SECRET!;

      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID,
        serverSecret,
        roomID,
        uuid(),
        `${user?.fname} ${user?.lname}`,
        720
      );

      const zp = ZegoUIKitPrebuilt.create(kitToken);

      // Join the room
      zp.joinRoom({
        container: containerRef.current!,
        sharedLinks: [
          {
            name: 'Sharable link',
            url: `${window.location.protocol}//${window.location.host}${window.location.pathname}?roomID=${roomID}`,
          },
        ],
        scenario: {
          mode: ZegoUIKitPrebuilt.VideoConference,
        },
        onUserJoin: async (users: ZegoUser[]) => {
          console.log('Users joined:', users);
          // You can handle UI updates here if needed
        },
        onUserLeave: (users: ZegoUser[]) => {
          console.log('Users left:', users);
          // You can handle UI updates here if needed
        },

        onLeaveRoom: () => {
          // Navigate away or clean up here if needed
        },
      });
    };

    initRoom().then(() => {});
  }, [roomId]);

  return <div className="w-full h-full" ref={containerRef} />;
};

export default RoomPage;
