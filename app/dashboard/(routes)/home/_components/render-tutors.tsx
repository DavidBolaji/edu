'use client';

import { Button } from '@/app/_components/ui/button';
import { cn } from '@/app/_lib/utils';
import { subscribeOrUnsubscribe } from '@/app/dashboard/_services/subscription.services';
import { handleSearch } from '@/app/dashboard/action';
import { User } from '@prisma/client';
import { Empty } from 'antd';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useCallback, useState } from 'react';
import { toast } from 'sonner';

const RenderTutors: React.FC<{ tutors: any; subscriptions: string[] }> = ({
  tutors,
  subscriptions,
}) => {
  const [id, setId] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleView = (id: string) => {
    router.push(`/dashboard/home/${id}`);
  };

  const handleSubscribe = async (tutorId: string, isSubscribed: boolean) => {
    setId(tutorId);
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

    setId('');
    setLoading((prev) => !prev);
    //force reload
    handleSearch(new FormData());
  };

  const subscribed = useCallback(
    (tutorId: string) => {
      return subscriptions.includes(tutorId);
    },
    [tutors]
  );

  const tutorList = tutors.map((tutor: User) => {
    const isSubscribed = subscribed(tutor.id);
    return (
      <div
        key={tutor.id}
        className="bg-white col-span-3 cursor-pointer rounded-xl p-4 hover:shadow-xl transition-transform duration-150 space-y-3 "
      >
        <div className="w-full space-y-3">
          <div className="flex items-center justify-center w-full h-full">
            <div className="w-16 h-16 bg-indigo-300 flex rounded-full items-center justify-center">
              <h3 className="text-white font-bold text-lg">
                {tutor?.fname?.charAt(0) || 'o'}
              </h3>
            </div>
          </div>
          <h2 className="font-semibold text-center font-space-mono flex items-center justify-center text-gray-800">
            {tutor.fname} {tutor.lname}
          </h2>
        </div>
        <div className="flex items-center justify-center w-full gap-3">
          <Button
            className={cn(
              'py-2 w-24 px-4 flex items-center bg-transparent justify-center',
              {
                'bg-indigo-100 hover:text-white text-indigo-500': !isSubscribed,
                'bg-primary': isSubscribed,
              }
            )}
            onClick={() => handleSubscribe(tutor.id, isSubscribed)}
          >
            {id === tutor.id && loading ? (
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            ) : (
              <span>{isSubscribed ? 'Subscribed' : 'Subscribe'}</span>
            )}
          </Button>
          <Button
            className={`py-2 w-24 px-4 flex items-center justify-center`}
            onClick={() => handleView(tutor.id)}
          >
            View
          </Button>
        </div>
      </div>
    );
  });
  return tutors.length ? (
    <div className="grid md:grid-cols-9 grid-cols-6 gap-3">{tutorList}</div>
  ) : (
    <Empty />
  );
};

export default RenderTutors;
