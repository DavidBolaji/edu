'use client';

import { useEffect } from 'react';
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
      router.push(redirectUrl);
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
