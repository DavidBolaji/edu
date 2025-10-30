import { SESSION_COOKIE } from '@/config';
import { cookies } from 'next/headers';
import { Layout } from 'antd';
import { Content } from 'antd/es/layout/layout';

import React, { PropsWithChildren } from 'react';
import { Sidebar } from './_components/sidebar';
import { DashboardHeader } from './_components/header';
import { Tab } from './_components/tab';
import { getDetails, validate } from './_services/user.services';
import { MediasContextProvider } from './(routes)/courses/[courseId]/[levelId]/_context/media-context';

import { MediaDialogs } from './(routes)/courses/[courseId]/[levelId]/_components/media-dialogs';
import { MediaViewerModal } from './(routes)/courses/[courseId]/[levelId]/_components/media-viewer-modal';
import SetupNotification from '../_components/setup-notification';

const Dashboardlayout: React.FC<PropsWithChildren> = async ({ children }) => {
  const sessionId = (await cookies()).get(SESSION_COOKIE)?.value;
  await validate(sessionId);

  const user = await getDetails();
  return (
    <MediasContextProvider>
      <SetupNotification />
      <Layout
        style={{
          overflowY: 'hidden',
          height: '100vh',
          minHeight: '100vh',
          position: 'relative',
        }}
      >
        <div className="absolute">
          <Sidebar role={user.role} />
        </div>
        <div className="xl:ml-64 bg-black">
          <Layout>
            <DashboardHeader name={user.fname} src={user.picture} />
            <Content
              style={{
                minHeight: '89vh',
                height: '89vh',
                padding: '16px 16px 100px 20px',
              }}
              className={`overflow-auto scrollbar-hide`}
            >
              {children}
            </Content>
            <Tab role={user.role} />
          </Layout>
        </div>
      </Layout>
      <MediaDialogs />
      <MediaViewerModal />
    </MediasContextProvider>
  );
};

export default Dashboardlayout;
