"use client";

import { useEffect, useState } from "react";

interface BrowserSupport {
  serviceWorker: boolean;
  pushManager: boolean;
  notifications: boolean;
  browserName: string;
  browserVersion: string;
  isSupported: boolean;
}

export default function BrowserSupportCheck() {
  const [support, setSupport] = useState<BrowserSupport | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkSupport = () => {
      const ua = navigator.userAgent;
      let browserName = "Unknown";
      let browserVersion = "";

      // Detect browser
      if (ua.includes("Firefox/")) {
        browserName = "Firefox";
        browserVersion = ua.match(/Firefox\/(\d+)/)?.[1] || "";
      } else if (ua.includes("Edg/")) {
        browserName = "Edge";
        browserVersion = ua.match(/Edg\/(\d+)/)?.[1] || "";
      } else if (ua.includes("Chrome/") && !ua.includes("Edg")) {
        browserName = "Chrome";
        browserVersion = ua.match(/Chrome\/(\d+)/)?.[1] || "";
      } else if (ua.includes("Safari/") && !ua.includes("Chrome")) {
        browserName = "Safari";
        browserVersion = ua.match(/Version\/(\d+)/)?.[1] || "";
      } else if (ua.includes("Opera") || ua.includes("OPR/")) {
        browserName = "Opera";
        browserVersion = ua.match(/(?:Opera|OPR)\/(\d+)/)?.[1] || "";
      }

      const serviceWorker = "serviceWorker" in navigator;
      const pushManager = "PushManager" in window;
      const notifications = "Notification" in window;
      const isSupported = serviceWorker && pushManager && notifications;

      setSupport({
        serviceWorker,
        pushManager,
        notifications,
        browserName,
        browserVersion,
        isSupported,
      });

      // Auto-dismiss after 10 seconds if supported
      if (isSupported) {
        setTimeout(() => setDismissed(true), 10000);
      }
    };

    checkSupport();
  }, []);

  if (!support || dismissed) {
    return null;
  }

  // Don't show warning if fully supported
  if (support.isSupported) {
    return null;
  }

  const getRecommendation = () => {
    if (support.browserName === "Safari") {
      const version = parseInt(support.browserVersion);
      if (version < 16) {
        return "Please update Safari to version 16.4 or later (macOS only). iOS Safari does not support web push notifications.";
      }
      return "Safari on iOS does not support web push notifications. Please use Safari 16.4+ on macOS or switch to Chrome/Firefox.";
    }

    if (support.browserName === "Opera") {
      return "Opera Mini does not support push notifications. Please use Opera desktop or switch to Chrome/Firefox.";
    }

    if (support.browserName === "Unknown") {
      return "Your browser may not support push notifications. Please use Chrome, Firefox, Edge, or Safari (macOS 16.4+).";
    }

    return "Please update your browser to the latest version or use Chrome, Firefox, Edge, or Safari (macOS 16.4+).";
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)",
        color: "#fff",
        padding: "16px 24px",
        borderRadius: "12px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
        zIndex: 10000,
        maxWidth: "90%",
        width: "500px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        animation: "slideDown 0.3s ease-out",
      }}
    >
      <style>{`
        @keyframes slideDown {
          from {
            transform: translateX(-50%) translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }
      `}</style>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: "bold", fontSize: "16px", marginBottom: "8px" }}>
            ⚠️ Push Notifications Not Available
          </div>

          <div style={{ fontSize: "14px", marginBottom: "12px" }}>
            <strong>Browser:</strong> {support.browserName}
            {support.browserVersion && ` ${support.browserVersion}`}
          </div>

          <div style={{ fontSize: "13px", marginBottom: "12px" }}>
            <div style={{ marginBottom: "6px" }}>
              <strong>Feature Support:</strong>
            </div>
            <div style={{ paddingLeft: "16px" }}>
              <div style={{ marginBottom: "4px" }}>
                {support.serviceWorker ? "✅" : "❌"} Service Workers
              </div>
              <div style={{ marginBottom: "4px" }}>
                {support.pushManager ? "✅" : "❌"} Push Manager
              </div>
              <div>
                {support.notifications ? "✅" : "❌"} Notifications API
              </div>
            </div>
          </div>

          <div
            style={{
              fontSize: "12px",
              background: "rgba(0,0,0,0.2)",
              padding: "12px",
              borderRadius: "8px",
              lineHeight: "1.5",
            }}
          >
            <strong>Recommendation:</strong> {getRecommendation()}
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          style={{
            background: "rgba(255,255,255,0.2)",
            border: "none",
            color: "#fff",
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            cursor: "pointer",
            fontSize: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginLeft: "12px",
            flexShrink: 0,
          }}
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}