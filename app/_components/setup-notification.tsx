"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export default function SetupNotification() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isVisible, setIsVisible] = useState<boolean>(true);

  useEffect(() => {
    async function setupPush() {
      try {
        // Check browser support
        if (!("serviceWorker" in navigator)) {
          const msg = "Service workers not supported in this browser";
          console.warn(msg);
          setStatus(msg);
          return;
        }

        if (!("PushManager" in window)) {
          const msg = "Push notifications not supported in this browser";
          console.warn(msg);
          setStatus(msg);
          return;
        }

        if (!("Notification" in window)) {
          const msg = "Notifications API not supported";
          console.warn(msg);
          setStatus(msg);
          return;
        }

        const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY;
        if (!vapidKey) {
          const msg = "Missing NEXT_PUBLIC_VAPID_KEY in environment";
          console.error(msg);
          setError(msg);
          return;
        }

        console.log("🔧 Starting push notification setup...");

        // Check if service worker is already registered
        let registration = await navigator.serviceWorker.getRegistration("/");

        if (!registration) {
          console.log("📝 Registering new service worker...");
          registration = await navigator.serviceWorker.register("/sw.js", {
            scope: "/",
            updateViaCache: "none",
            type: "classic",
          });
          console.log("✅ Service worker registered:", registration.scope);
        } else {
          console.log("✅ Service worker already registered:", registration.scope);
        }

        // Wait for service worker to be active
        if (registration.installing) {
          console.log("⏳ Service worker installing...");
          await new Promise<void>((resolve) => {
            registration!.installing!.addEventListener("statechange", (e) => {
              if ((e.target as ServiceWorker).state === "activated") {
                resolve();
              }
            });
          });
        } else if (registration.waiting) {
          console.log("⏳ Service worker waiting...");
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }

        // Ensure service worker is ready
        registration = await navigator.serviceWorker.ready;
        console.log("✅ Service worker ready");

        // Check current notification permission
        let permission = Notification.permission;
        console.log("🔔 Current notification permission:", permission);

        if (permission === "default") {
          console.log("📢 Requesting notification permission...");
          permission = await Notification.requestPermission();
          console.log("📢 Permission result:", permission);
        }

        if (permission === "denied") {
          const msg = "Notification permission denied by user";
          console.warn(msg);
          setStatus(msg);
          setError("Please enable notifications in your browser settings");
          return;
        }

        if (permission !== "granted") {
          const msg = "Notification permission not granted";
          console.warn(msg);
          setStatus(msg);
          return;
        }

        // Check if already subscribed
        let subscription = await registration.pushManager.getSubscription();

        if (subscription) {
          console.log("✅ Already subscribed to push notifications");
          console.log("Subscription endpoint:", subscription.endpoint);
        } else {
          console.log("📝 Creating new push subscription...");

          try {
            const applicationServerKey = urlBase64ToUint8Array(vapidKey);
            console.log('applicationServerKey length:', applicationServerKey.length, applicationServerKey);
            console.log('vapidKey (first/last chars):', vapidKey.slice(0, 8), '...', vapidKey.slice(-8));
            const ps = await registration.pushManager.permissionState({ userVisibleOnly: true });
            console.log('PushManager.permissionState:', ps);
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: applicationServerKey as BufferSource,
            });
            console.log("✅ Push subscription created");
            console.log("Subscription endpoint:", subscription.endpoint);
          } catch (subError) {
            console.error("❌ Failed to subscribe to push:", subError);
            setError("Failed to create push subscription: " + (subError as Error).message);
            return;
          }
        }

        // Send subscription to backend
        console.log("💾 Saving subscription to server...");
        const res = await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Server error (${res.status}): ${errorText}`);
        }

        const result = await res.json();
        console.log("✅ Subscription saved to server:", result);

        // Update query cache
        queryClient.setQueryData(["subscribed-to-push"], true);
        setStatus("✅ Push notifications enabled successfully!");
        setError("");

        // Show a test notification in development
        if (process.env.NODE_ENV === "development") {
          setTimeout(() => {
            new Notification("Setup Complete! 🎉", {
              body: "You will now receive push notifications",
              icon: "/icons/icon-192x192.png",
              badge: "/icons/icon-96x96.png",
            });
          }, 1000);
        }

      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error("❌ Error setting up push notifications:", err);
        setError(errorMsg);
        setStatus("Setup failed");
      }
    }

    // Small delay to ensure page is fully loaded
    const timer = setTimeout(setupPush, 1000);
    return () => clearTimeout(timer);
  }, [queryClient]);

  // Show status indicator in development mode only
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  if (!status && !error) {
    return null;
  }

  if (!isVisible) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        background: error ? "#ff4444" : status.includes("✅") ? "#44ff44" : "#ffaa44",
        color: error || status.includes("✅") ? "#fff" : "#000",
        padding: "12px 20px",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        fontSize: "13px",
        zIndex: 9999,
        maxWidth: "350px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
        <div style={{ fontWeight: "bold" }}>
          Push Notification Setup
        </div>
        <button
          onClick={() => setIsVisible(false)}
          style={{
            background: "transparent",
            border: "none",
            color: "inherit",
            cursor: "pointer",
            fontSize: "18px",
            lineHeight: "1",
            padding: "0",
            marginLeft: "12px",
            opacity: 0.7,
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
          onMouseLeave={(e) => e.currentTarget.style.opacity = "0.7"}
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <div>{status}</div>
      {error && (
        <div style={{ marginTop: "8px", fontSize: "12px", opacity: 0.9 }}>
          {error}
        </div>
      )}
    </div>
  );
}

/**
 * Convert VAPID public key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}