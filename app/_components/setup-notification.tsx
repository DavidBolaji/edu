'use client';
import { useEffect } from 'react';
import usePwa from '../_hooks/use-pwa';
import { usePathname } from 'next/navigation';

const SetupNotification = () => {
  const path = usePathname();
  const { showNotification } = usePwa();

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      const subscribe = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          // Call showNotification only after successful registration
        
          showNotification();
        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      };

      window.addEventListener('load', subscribe);

      return () => {
        window.removeEventListener('load', subscribe);
      };
    }
  }, [path]);

  return null;
};

export default SetupNotification;
