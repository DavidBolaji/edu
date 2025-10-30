'use client';

import { handleNotification } from '@/action/action';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

const usePwa = () => {
  const queryClient = useQueryClient();
  useEffect(() => {
subscribeToPush()
  }, [])
  // Initialize REGISTER query data if not set already
  if (!queryClient.getQueryData(['SUBSCRIPTION'])) {
    queryClient.setQueryData(['SUBSCRIPTION'], () => false);
  }

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeToPush = async () => {
    if (typeof navigator !== 'undefined' && navigator.serviceWorker) {
      // ✅ Ask for Notification permission first
      const permission = await Notification.requestPermission();
      
      console.log('PERMISSION', permission)
      if (permission !== 'granted') {
        console.warn('Permission for notifications was denied');
        return;
      }

    
      
      try {
        const registration = await navigator.serviceWorker.ready;
      
        
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_KEY!
          ),
        });
        
       
        const serializedSub = JSON.parse(JSON.stringify(subscription));

        const sub = await handleNotification(serializedSub);

        queryClient.setQueryData(['SUBSCRIPTION'], sub);
      } catch (error) {
        console.error('Error during subscription:', error);
      }
    } else {
      console.warn('Service Worker or Navigator not available');
    }
  };

  const showNotification = async () => {
    await subscribeToPush();
  };

  const { data: subscription } = useQuery({
    queryKey: ['SUBSCRIPTION'],
    queryFn: async () => queryClient.getQueryData(['SUBSCRIPTION']) as boolean,
  });

  return { showNotification, subscription };
};

export default usePwa;
