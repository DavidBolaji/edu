'use client';

import { Button } from '@/app/_components/ui/button';
import { cn } from '@/app/_lib/utils';
import { subscribeOrUnsubscribe } from '@/app/dashboard/_services/subscription.services';
import { handleSearch } from '@/app/dashboard/action';
import { User } from '@prisma/client';
import { Empty } from 'antd';
import { Loader2, Eye, UserCheck, UserPlus } from 'lucide-react';
import Image from 'next/image';
import React, { useCallback, useState } from 'react';
import { toast } from 'sonner';

const RenderTutors: React.FC<{ tutors: any; subscriptions: string[] }> = ({
  tutors,
  subscriptions,
}) => {
  const [id, setId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleView = (id: string) => {
    (window as any).__showTopProgress?.();
    (window as any).__showOverlayLoading?.();
    
    // Use window navigation with force reload
    window.location.href = `/dashboard/home/${id}`;
  };

  const handleSubscribe = async (tutorId: string, isSubscribed: boolean) => {
    setId(tutorId);
    setLoading(true);
    const response = await subscribeOrUnsubscribe(tutorId);

    if (!response.success) {
      toast.error(`Subscription Failed: ${response.error}`, {
        position: 'top-right',
      });
    } else {
      toast.success(
        isSubscribed
          ? 'Unsubscription successful'
          : 'Subscription successful',
        { position: 'top-right' }
      );
    }

    setId('');
    setLoading(false);
    handleSearch(new FormData());
  };

  const subscribed = useCallback(
    (tutorId: string) => {
      return subscriptions.includes(tutorId);
    },
    [subscriptions]
  );

  const tutorList = tutors.map((tutor: User) => {
    const isSubscribed = subscribed(tutor.id);
    const isLoading = id === tutor.id && loading;
    
    return (
      <div
        key={tutor.id}
        className="group bg-white rounded-2xl p-5 hover:shadow-2xl shadow-md transition-all duration-300 hover:-translate-y-1 border border-gray-100"
      >
        {/* Avatar Section */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            {tutor?.picture ? (
              <Image
                src={tutor.picture}
                width={200}
                height={200}
                alt={`${tutor.fname} ${tutor.lname}`}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover shadow-lg group-hover:shadow-indigo-300 transition-shadow duration-300 border-2 border-indigo-200"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-indigo-300 transition-shadow duration-300">
                <h3 className="text-white font-bold text-2xl sm:text-3xl">
                  {tutor?.fname?.charAt(0).toUpperCase() || 'T'}
                </h3>
              </div>
            )}
            {isSubscribed && (
              <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1.5 shadow-md">
                <UserCheck className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Name Section */}
        <h2 className="font-semibold text-center text-gray-800 text-base sm:text-lg mb-4 px-2 line-clamp-2 min-h-[3rem] flex items-center justify-center">
          {tutor.fname} {tutor.lname}
        </h2>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch justify-center gap-2">
          <Button
            className={cn(
              'w-full py-2 px-3 font-medium transition-all duration-200 text-sm whitespace-nowrap',
              {
                'bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white border border-indigo-200': !isSubscribed,
                'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white': isSubscribed,
              }
            )}
            onClick={() => handleSubscribe(tutor.id, isSubscribed)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                {isSubscribed ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Subscribed</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Subscribe</span>
                  </>
                )}
              </span>
            )}
          </Button>
          
          <Button
            className="w-full py-2 px-3 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white font-medium transition-all duration-200 text-sm whitespace-nowrap"
            onClick={() => handleView(tutor.id)}
          >
            <span className="flex items-center justify-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              <span>View</span>
            </span>
          </Button>
        </div>
      </div>
    );
  });

  return tutors.length ? (
    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
      {tutorList}
    </div>
  ) : (
    <div className="flex items-center justify-center py-12">
      <Empty description="No tutors available" />
    </div>
  );
};

export default RenderTutors;