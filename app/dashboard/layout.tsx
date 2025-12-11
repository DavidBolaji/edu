import { SESSION_COOKIE } from '@/config';
import { cookies } from 'next/headers';
import React, { PropsWithChildren } from 'react';
import { Sidebar } from './_components/sidebar';
import { DashboardHeader } from './_components/header';
import { Tab } from './_components/tab';
import { getDetails, validate } from './_services/user.services';
import SetupNotification from '../_components/setup-notification';
import BrowserSupportCheck from '../_components/browser-support';

const Dashboardlayout: React.FC<PropsWithChildren> = async ({ children }) => {
  const sessionId = cookies().get(SESSION_COOKIE)?.value;
  await validate(sessionId);

  const user = await getDetails();
  
  return (
    <>
      <SetupNotification />
      <div className="flex h-screen bg-gray-50" style={{ overflow: 'hidden' }}>
        {/* Sidebar - Collapsible */}
        <div style={{ overflow: 'visible' }}>
          <Sidebar role={user.role} />
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0" style={{ overflow: 'hidden' }}>
          {/* Fixed Header */}
          <div >
            <DashboardHeader name={user.fname} src={user.picture} />
          </div>
          
          {/* Scrollable Content */}
          <main className="flex-1 bg-gray-50" style={{ overflow: 'auto' }}>
            <div className="p-4 md:p-6 lg:p-8 pb-24 lg:pb-8" style={{ overflow: 'visible' }}>
              <BrowserSupportCheck />
              {children}
            </div>
          </main>
        </div>
        
        {/* Mobile Tab Navigation */}
        <Tab role={user.role} />
      </div>
    </>
  );
};

export default Dashboardlayout;
