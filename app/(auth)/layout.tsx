import { SESSION_COOKIE } from '@/config';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import React, { PropsWithChildren } from 'react';

const Authlayout: React.FC<PropsWithChildren> = async ({ children }) => {
  const sessionId = (await cookies()).get(SESSION_COOKIE)?.value;

  if (sessionId) {
    return redirect('/dashboard/home');
  }
  return <div className="bg-primary md:px-0 px-4">{children}</div>;
};

export default Authlayout;
