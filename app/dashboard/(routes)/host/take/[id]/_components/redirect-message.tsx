'use client';

import { startTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface RedirectMessageProps {
  message: string;
  redirectUrl: string;
  delay?: number;
}

export const RedirectMessage = ({
  message,
  redirectUrl,
  delay = 2500
}: RedirectMessageProps) => {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      // start showing the loading bar
      ; (window as any).__showTopProgress?.()
        ; (window as any).__showOverlayLoading?.()
      // perform the navigation
      startTransition(() => {
        router.push(redirectUrl);
      })
    }, delay);

    return () => clearTimeout(timer);
  }, [router, redirectUrl, delay]);

  return (
    <div className="flex flex-col items-center pt-20">
      <p className="text-lg font-semibold text-center text-gray-700">
        {message}
      </p>
      <p className="text-sm text-gray-500 mt-2">
        Redirecting...
      </p>
    </div>
  );
};
