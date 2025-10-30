'use client';

import { Grid } from 'antd';
import React, { startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Book, HomeIcon, SaveIcon, User2Icon } from 'lucide-react';

import usePath from '../_hooks/use-path';
import { cn } from '@/app/_lib/utils';
import { ROLE } from '@prisma/client';

const { useBreakpoint } = Grid;

const protect = [
  {
    label: 'Courses',
    path: '/dashboard/courses',
    icon: <Book size={20} />,
  },
  // {
  //   label: 'Profile',
  //   path: '/dashboard/portal',
  //   icon: <Power size={20} />,
  // },
];

const items = [
  {
    label: 'Dashboard',
    path: '/dashboard/home',
    icon: <HomeIcon size={20} />,
  },
  {
    label: 'Library',
    path: '/dashboard/library',
    icon: <SaveIcon size={20} />,
  },
  {
    label: 'Profile',
    path: '/dashboard/profile',
    icon: <User2Icon size={20} />,
  },
];

export const Tab: React.FC<{ role: ROLE }> = ({ role }) => {
  const { locationCurrent } = usePath();
  const screen = useBreakpoint();
  const router = useRouter();
  const isAdmin = role === 'LECTURER';

  const isActive = (path: string) => locationCurrent === path;
  const newItems = isAdmin ? [...items, ...protect] : items;

  return (
    !screen.xl && (
      <div className="fixed h-20  bottom-0 left-0 w-full bg-white shadow-md z-50">
        <div
          className={cn('grid mt-2 text-center text-xs py-2', {
            'grid-cols-4': isAdmin,
            'grid-cols-3': !isAdmin,
          })}
        >
          {newItems.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                // start showing the loading bar
                ; (window as any).__showTopProgress?.()
                  ; (window as any).__showOverlayLoading?.()
                // perform the navigation
                startTransition(() => {
                  router.push(item.path)
                })
              }
              }
              className={cn(
                'flex flex-col items-center gap-1 text-sm transition-all text-gray-500 hover:text-blue-600 hover:font-semibold',
                { 'text-blue-600 font-semibold': isActive(item.path) }
              )}
            >
              {item.icon}
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    )
  );
};
