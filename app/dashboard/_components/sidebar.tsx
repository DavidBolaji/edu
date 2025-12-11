'use client';

import Image from 'next/image';
import React, { startTransition, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Book,
  HomeIcon,
  LogOut,
  SaveIcon,
  User2Icon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/app/_lib/utils';

import usePath from '../_hooks/use-path';
import { signOut } from '../action';
import { ROLE } from '@prisma/client';

interface MenuItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const menuItems: MenuItem[] = [
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
  {
    label: 'Courses',
    path: '/dashboard/courses',
    icon: <Book size={20} />,
  },
];

const protectedItems = ['Courses'];

export const Sidebar: React.FC<{ role: ROLE }> = ({ role }) => {
  const { locationCurrent } = usePath();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
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

  const handleNavigation = (path: string) => {
    // start showing the loading bar
    (window as any).__showTopProgress?.();
    (window as any).__showOverlayLoading?.();

    // perform the navigation
    startTransition(() => {
      router.push(path);
    });
  };

  const filteredItems = menuItems.filter((item) => {
    if (role === 'STUDENT') return !protectedItems.includes(item.label);
    return true;
  });

  // Don't render until client-side to avoid hydration mismatch
  if (!isClient) {
    return (
      <div className="hidden lg:block w-64 bg-blue-600 h-screen">
        {/* Placeholder to prevent layout shift */}
      </div>
    );
  }

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col bg-blue-600 h-screen transition-all duration-300 ease-in-out border-r border-blue-500',
        isCollapsed ? 'w-16' : 'w-64'
      )}
      style={{ overflow: 'auto', position: 'relative' }}
    >
      {/* Logo Section */}
      <div className="flex items-center justify-center p-4 border-b border-blue-500">
        {!isCollapsed ? (
          <Image
            priority
            width={120}
            height={60}
            src="/logo.png"
            alt="Edutainment logo"
            className="object-contain"
          />
        ) : (
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-bold text-sm">E</span>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-4 space-y-2">
        {filteredItems.map((item) => {
          const isActive = locationCurrent === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-200',
                'hover:bg-black/20 group',
                isActive && 'bg-black border-l-4 border-white',
                isCollapsed && 'justify-center px-2'
              )}
            >
              <span
                className={cn(
                  'text-white transition-colors',
                  isActive && 'text-white'
                )}
              >
                {item.icon}
              </span>
              {!isCollapsed && (
                <span
                  className={cn(
                    'text-white font-medium transition-colors',
                    isActive && 'text-white'
                  )}
                >
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse Toggle Button */}
      <div className="p-3 border-t border-blue-500">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center p-2 text-white hover:bg-black/20 rounded-lg transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight size={20} />
          ) : (
            <ChevronLeft size={20} />
          )}
        </button>
      </div>

      {/* Logout Button */}
      <div className="p-3 border-t border-blue-500">
        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-3 text-white hover:bg-red-600/20 rounded-lg transition-all duration-200',
            isCollapsed && 'justify-center px-2'
          )}
        >
          <LogOut size={20} />
          {!isCollapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
};
