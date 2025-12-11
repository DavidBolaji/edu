'use client';

import { Button } from '@/app/_components/ui/button';
import { cn } from '@/app/_lib/utils';
import { subscribeOrUnsubscribe } from '@/app/dashboard/_services/subscription.services';

import { Loader2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import React, { useCallback, useState, startTransition } from 'react';
import { toast } from 'sonner';

const RenderButtons: React.FC<{
  tutorId: string;
  subscriptions: string[];
  join: { isLive: boolean; code: string | null; userId: string, name: string };
}> = ({ tutorId, subscriptions, join }) => {
  const [loading, setLoading] = useState(false);
  const params = useParams();
  const router = useRouter();

  const handleSubscribe = async (tutorId: string, isSubscribed: boolean) => {
    setLoading((prev) => !prev);
    const response = await subscribeOrUnsubscribe(tutorId);

    if (!response.success) {
      toast.error(`Subscription Failed: ${response.error}`, {
        position: 'top-right',
      });
    } else {
      toast.success(
        isSubscribed
          ? 'Unsubscription successfull'
          : 'Subscription successfull',
        { position: 'top-right' }
      );
    }

    setLoading((prev) => !prev);
    //force reload
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const subscribed = useCallback(
    (tutorId: string) => {
      return subscriptions.includes(tutorId);
    },
    [subscriptions, tutorId]
  );
  // console.log('[SUB]', subscriptions);
  const isSubscribed = subscribed(tutorId);

  const handleJoin = () => {
    console.log(join.code, join.userId)
      // start showing the loading bar
      ; (window as any).__showTopProgress?.()
      ; (window as any).__showOverlayLoading?.()
    // perform the navigation
    startTransition(() => {
      router.push(`/dashboard/class?roomId=${join.code}&userId=${join.userId}&name=${join.name}`);
    })
  };

  const handleViewPortal = () => {
    // start showing the loading bar
    ; (window as any).__showTopProgress?.()
      ; (window as any).__showOverlayLoading?.()
    // perform the navigation
    startTransition(() => {
      router.push(`/dashboard/portal/${tutorId}`);
    })
  };

  const handleViewQuiz = () => {
    // start showing the loading bar
    ; (window as any).__showTopProgress?.()
      ; (window as any).__showOverlayLoading?.()
    // perform the navigation
    startTransition(() => {
      router.push(`/dashboard/host/quiz/${tutorId}`);
    })
  };

  return (
    <div className="text-center space-y-3 py-4">
      <Button
        onClick={() => handleSubscribe(tutorId, isSubscribed)}
        className={cn('w-60 px-4 py-2', {
          'bg-indigo-100 hover:text-white text-indigo-500': !isSubscribed,
          'bg-primary': isSubscribed,
        })}
      >
        {loading ? (
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        ) : (
          <span>{isSubscribed ? 'Subscribed' : 'Subscribe'}</span>
        )}
      </Button>
      <div className="flex justify-center space-x-3">
        <Button className="bg-indigo-500 w-28 px-4 py-2" onClick={handleViewPortal}>
          Portal
        </Button>
        <Button className="bg-indigo-500 w-28 px-4 py-2" onClick={handleViewQuiz}>
          Quiz
        </Button>
      </div>
      {join.isLive && (
        <Button
          onClick={handleJoin}
          className={cn('w-60 px-4 py-2', {
            'bg-indigo-100 hover:text-white text-indigo-500': !isSubscribed,
            'bg-primary': isSubscribed,
          })}
        >
          Join Live Class
        </Button>
      )}
    </div>
  );
};

export default RenderButtons;
