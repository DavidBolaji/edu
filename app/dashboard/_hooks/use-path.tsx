'use client';
import { useParams, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const usePath = () => {
  const pathname = usePathname();
  const params = useParams();
  const customerId = params?.customerId;
  const courseId = params?.courseId;
  const roomId = params?.roomId;
  const takeId = params?.quizId;
  const portalId = params?.id;
  const portalId2 = params?.portalId;
  const levelId = params?.levelId;
  const id = params?.id;
  const bookingId = params?.bookingId;
  const eventId = params?.eventId;
  const promotionId = params?.promotionId;

  const [locationCurrent, setLoc] = useState('');

  useEffect(() => {
    const key =
      pathname === '/dashboard/home'
        ? '/dashboard/home'
        : pathname === `/dashboard/home/${id}`
        ? '/dashboard/home'
        : pathname === '/dashboard/library'
        ? '/dashboard/library'
        : pathname === '/dashboard/library/add'
        ? '/dashboard/library'
        : pathname === `/dashboard/library/${eventId}/edit`
        ? '/dashboard/events'
        : pathname === `/dashboard/host`
        ? '/dashboard/profile'
        : pathname === `/dashboard/host/host`
        ? '/dashboard/profile'
        : pathname === `/dashboard/class`
        ? '/dashboard/profile'
        : pathname === `/dashboard/host/quiz/${id}`
        ? '/dashboard/profile'
        : pathname === `/dashboard/host/take/${id}`
        ? '/dashboard/profile'
        : pathname === '/dashboard/customers'
        ? '/dashboard/customers'
        : pathname === '/dashboard/unviewed'
        ? '/dashboard/home'
        : pathname === `/dashboard/room/${roomId}`
        ? '/dashboard/profile'
        : pathname === `/dashboard/portal`
        ? '/dashboard/profile'
        : pathname === '/dashboard/profile'
        ? '/dashboard/profile'
        : pathname === '/dashboard/subscription'
        ? '/dashboard/profile'
        : pathname === '/dashboard/analytics'
        ? '/dashboard/profile'
        : pathname === '/dashboard/host/take'
        ? '/dashboard/profile'
        : pathname === `/dashboard/portal/submissions/${portalId2}`
        ? '/dashboard/profile'
        : pathname === `/dashboard/courses/${courseId}`
        ? '/dashboard/courses'
        : pathname === `/dashboard/host/take/${takeId}`
        ? '/dashboard/courses'
        : pathname === `/dashboard/courses/${courseId}/${levelId}`
        ? '/dashboard/courses'
        : pathname === `/dashboard/portal/${portalId}`
        ? '/dashboard/profile'
        : pathname === '/dashboard/courses'
        ? '/dashboard/courses'
        : pathname === '/dashboard/profile/add'
        ? '/dashboard/profile'
        : pathname === `/dashboard/customers/${customerId}`
        ? '/dashboard/customers'
        : pathname === `/dashboard/customers/${customerId}/edit`
        ? '/dashboard/customers'
        : pathname === `/dashboard/promotions`
        ? '/dashboard/promotions'
        : pathname === `/dashboard/profile/${bookingId}`
        ? '/dashboard/profile'
        : pathname?.split('/')[pathname?.split('/').length - 1];
    setLoc(key);
  }, [pathname, customerId, bookingId, promotionId, eventId, courseId, roomId]);

  return { locationCurrent };
};

export default usePath;
