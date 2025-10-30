
'use client'
import { useCallback, useState } from 'react';

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_KEY!;

export function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i);
  return output;
}

export default function usePushSubscription() {
  const [status, setStatus] = useState<'idle'|'granted'|'denied'|'subscribed'|'error'>('idle');

  const subscribe = useCallback(async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setStatus('error');
        throw new Error('Push not supported');
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus('denied');
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      });

      // send subscription to server
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription }),
      });

      if (!res.ok) throw new Error('Failed to store subscription');

      setStatus('subscribed');
      return subscription;
    } catch (err) {
      console.error('subscribe error', err);
      setStatus('error');
      throw err;
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const sub = registration && (await registration.pushManager.getSubscription());
      if (!sub) return;
      await sub.unsubscribe();
      // inform server to remove
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
      setStatus('idle');
    } catch (e) {
      console.error(e);
    }
  }, []);

  return { status, subscribe, unsubscribe };
}
