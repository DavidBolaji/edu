'use client';

import React, { startTransition } from 'react';
import MyImageAndSchool from './my-image-and-school';
import MyCounts from './my-counts';
import { UserDetail } from '@/src/entities/models/user';

import { v4 as uuid } from 'uuid';
import { useRouter } from 'next/navigation';
import { useCreatorActions } from '../../room/[roomId]/_hooks/use-creator-action';
import { Button } from '@/app/_components/ui/button';

const ViewProfile: React.FC<{ user: UserDetail }> = ({ user }) => {
  const router = useRouter();
  const { endCallForAll, markUserLive, createCall } = useCreatorActions();
  const handleClick = async () => {
    const id = user?.code || uuid()
    if (!user.code) {

      const live = markUserLive(id)
      const call = createCall(id)

      try {
        await Promise.all([live, call])
      } catch (error) {
        console.log(`an error occured ${(error as Error).message}`)
        return;
      }

    }

    // start showing the loading bar
    ; (window as any).__showTopProgress?.()
      ; (window as any).__showOverlayLoading?.()
    // perform the navigation
    startTransition(() => {
      router.push(`/dashboard/class?roomId=${id}&userId=${user.id}&creator=1&name=${`${user.fname} ${user.lname}`}`);
    })
  };

  const handleHostQuiz = () => {
    // start showing the loading bar
    ; (window as any).__showTopProgress?.()
      ; (window as any).__showOverlayLoading?.()
    // perform the navigation
    startTransition(() => {
      router.push(`/dashboard/host`);
    })
  };
  const handleCreatePortal = () => {
    // start showing the loading bar
    ; (window as any).__showTopProgress?.()
      ; (window as any).__showOverlayLoading?.()
    // perform the navigation
    startTransition(() => {
      router.push(`/dashboard/portal`);
    })
  };
  const handleAnalytics = () => {
    // start showing the loading bar
    ; (window as any).__showTopProgress?.()
      ; (window as any).__showOverlayLoading?.()
    // perform the navigation
    startTransition(() => {
      router.push(`/dashboard/analytics`);
    })
  };

  const handleSubscription = () => {
    // start showing the loading bar
    ; (window as any).__showTopProgress?.()
      ; (window as any).__showOverlayLoading?.()
    // perform the navigation
    startTransition(() => {
      router.push(`/dashboard/subscription`);
    })
  };

  const endCall = async () => {
    if (
      confirm(
        'Are you sure you want to end the call for everyone?' + ' ' + user.code
      )
    ) {
      await endCallForAll(async () => {
        return '';
      }, user.code as string);
    }
  };
  return (
    <div className="w-full">
      {/* <ProfileDrawer /> */}

      <div>
        <MyImageAndSchool user={user} />
        <MyCounts user={user} />
        {/* <CreateViewCourse /> */}
        {user?.role === 'LECTURER' && (
          <div>
            <div className="mt-2 flex gap-4 justify-center">
              <div className="">
                <Button className="w-24" onClick={handleClick}>
                  Go Live
                </Button>
              </div>
              <div className="">
                <Button className="w-24" onClick={handleHostQuiz}>
                  Host Quiz
                </Button>
              </div>
              {/* <div className="pl-1.5 w-1/2"><SubmissionPortal /></div> */}
            </div>
            <div className="mt-2 flex gap-4 justify-center">
              <div className="">
                <Button className="w-24" onClick={handleCreatePortal}>
                  Portal
                </Button>
              </div>
              <div className="">
                <Button className="w-24" onClick={handleAnalytics}>
                  Analytics
                </Button>
              </div>
              {/* <div className="pl-1.5 w-1/2"><SubmissionPortal /></div> */}
            </div>
          </div>
        )}
        <div className="mx-auto mt-4 max-w-md">
          <Button
            className="w-24 mx-auto flex justify-center"
            onClick={handleSubscription}
          >
            Subscription
          </Button>
        </div>
        {user.isLive && (
          <div className="mt-2 flex gap-4 justify-center">
            <div className="">
              <Button className="w-24" onClick={handleClick}>
                Rejoin
              </Button>
            </div>
            <div className="">
              <Button className="w-24" onClick={endCall}>
                End Call
              </Button>
            </div>
            {/* <div className="pl-1.5 w-1/2"><SubmissionPortal /></div> */}
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewProfile;
