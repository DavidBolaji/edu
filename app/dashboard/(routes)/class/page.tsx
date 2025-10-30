"use client";

import { LiveKitRoom } from "@livekit/components-react";
import "@livekit/components-styles";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CustomConference from "./_components/custom-conference";
import { jwtDecode } from "jwt-decode";
import { useCreatorActions } from "../room/[roomId]/_hooks/use-creator-action";

interface TokenPayload {
  metadata?: string;
}

export default function LiveRoomPage() {
  const params = useSearchParams();
  const router = useRouter();
  const { endCallForAll, addUserToAttendees } = useCreatorActions();

  const roomId = params.get("roomId");
  const userId = params.get("userId") ?? "guest";
  const creator = params.get("creator");
  const name = params.get("name");

  const [token, setToken] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [user, setUser] = useState<string | null>(null);

  const handleEndCall = async () => {
    await endCallForAll(async () => {
      return '';
    }, roomId as string);
  }

  useEffect(() => {
    if (!roomId) return;

    const fetchToken = async () => {
      try {
        const res = await fetch(`/api/token?room=${roomId}&username=${userId}&creator=${creator}&name=${name}`);
        const data = await res.json();
        setToken(data.token);
  
        const payload = jwtDecode<TokenPayload>(data.token);
        const metadata = payload.metadata ? JSON.parse(payload.metadata) : {};
        const isHost = metadata.role === "host"
        setIsHost(isHost);
        setUser(metadata.name);
        if(!isHost) {
          await addUserToAttendees(roomId)
        }

      } catch (e) {

      }
    };

    fetchToken();
  }, [roomId, userId]);

  if (!roomId) return <p>No session found</p>;
  if (!token) return <p>Loading...</p>;

  return (
    <LiveKitRoom
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL!}
      connect={true}
      audio={true}
      video={true}
      onDisconnected={() => router.push("/dashboard/profile")}
    >
      <CustomConference roomId={roomId} isHost={isHost} endCall={handleEndCall} name={user} />
    </LiveKitRoom>

  );
}
