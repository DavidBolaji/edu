"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export default function SetupNotification() {
  const queryClient = useQueryClient();

  useEffect(() => {
    async function setupPush() {
      if (!("serviceWorker" in navigator)) {
        console.warn("Service workers are not supported");
        return;
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY;
      if (!vapidKey) {
        console.error("Missing NEXT_PUBLIC_VAPID_KEY in .env.local");
        return;
      }

      try {
        // 1️⃣ Register the service worker
        const registration = await navigator.serviceWorker.register("/sw.js");
        console.log("Service Worker registered:", registration);

        // 2️⃣ Request notification permission
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.log("Notification permission not granted");
          return;
        }

        // 3️⃣ Subscribe user
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });

        // 4️⃣ Send subscription to backend
        const res = await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({subscription}),
        });

        if (!res.ok) {
          console.error("Failed to save push subscription");
        } else {
          queryClient.setQueryData(["subscribed-to-push"], true);
          console.log("Push subscription saved successfully");
        }
      } catch (err) {
        console.error("Error setting up notifications:", err);
      }
    }

    setupPush();
  }, [queryClient]);

  return null;
}

function urlBase64ToUint8Array(base64String: string) {
  if (!base64String) throw new Error("Invalid VAPID key");
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
