'use client';

import { Grid, MenuProps } from 'antd';
import Sider from 'antd/es/layout/Sider';
import Image from 'next/image';
import React, { startTransition, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Book,
  HomeIcon,
  LogOut,
  Power,
  SaveIcon,
  User2Icon,
} from 'lucide-react';
import { toast } from 'sonner';

import { MenuStyled } from './styled/menu.styled';
import usePath from '../_hooks/use-path';
import { signOut } from '../action';
import { ROLE } from '@prisma/client';
const { useBreakpoint } = Grid;

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
  type?: 'group'
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
    type,
  } as MenuItem;
}

const items: MenuItem[] = [
  getItem('Dashboard', '/dashboard/home', <HomeIcon />),
  getItem('Library', '/dashboard/library', <SaveIcon />),
  getItem('Profile', '/dashboard/profile', <User2Icon />),
  getItem('Courses', '/dashboard/courses', <Book />),
  // getItem('Portal', '/dashboard/portal', <Power />),
];

const protect = ['Portal', 'Courses'];

export const Sidebar: React.FC<{ role: ROLE }> = ({ role }) => {
  const { locationCurrent } = usePath();
  const screen = useBreakpoint();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  // Fix hydration mismatch by ensuring client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogout = async () => {
    const response = await signOut();

    if (!response?.error) {
      return toast.success('Successfully signed out');
    }

    return toast.error(response.error);
  };

  // Don't render until client-side to avoid hydration mismatch
  if (!isClient) {
    return (
      <div className="hidden xl:block w-[269px] bg-blue-600 h-screen">
        {/* Placeholder to prevent layout shift */}
      </div>
    );
  }

  // Always render sidebar, but handle responsive behavior
  return (
    <Sider
      trigger={null}
      style={{
        backgroundColor: '#2563eb',
        height: '100vh',
        maxHeight: '100vh',
        position: 'sticky',
        top: 0,
        borderRight: '1px solid #ABD0E4',
      }}
      width={269}
      className="hidden xl:block"
    >
        <div className="w-full bg-primary mb-10">
          <Image
            priority
            width={200}
            height={200}
            src={'/logo.png'}
            alt="Edutainment logo"
            className="mx-auto"
          />
        </div>
        <MenuStyled
          theme="dark"
          mode="inline"
          defaultSelectedKeys={[locationCurrent]}
          selectedKeys={[locationCurrent]}
          onClick={(menuInfo: { key: string }) => {
            // start showing the loading bar
            ; (window as any).__showTopProgress?.()
             ;(window as any).__showOverlayLoading?.()

            // perform the navigation
            startTransition(() => {
              router.push(menuInfo?.key)
            })
          }
          }
          items={items.filter((el: any) => {
            if (role === 'STUDENT') return !protect.includes(el.label);
            return true;
          })}
        />
        <div
          className="absolute bottom-6 px-5 -translate-x-2 cursor-pointer gap-3 font-bold font-onest pl-12 flex items-center red-100 text-white"
          onClick={handleLogout}
        >
          <LogOut size={16} />
          Logout
        </div>
      </Sider>
  );
};
