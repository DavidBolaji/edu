'use client';

import Image from 'next/image';
import AvatarComponent from './avatar-component';
import { LogOut, MenuIcon, XIcon } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { signOut } from '../action';
import { toast } from 'sonner';

export const DashboardHeader: React.FC<{
  name: string;
  src: string | null;
}> = ({ name, src = null }) => {
  const [visible, setVisible] = useState(false);
  const router = useRouter();

  const handleMenuClick = () => {
    setVisible((prev) => !prev);
  };

  const handleLogout = async () => {
    const response = await signOut();

    if (!response?.error) {
      return toast.success('Successfully signed out');
    }

    return toast.error(response.error);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 h-16 px-4 lg:px-6" style={{ overflow: 'visible', position: 'sticky' }}>
      <div className="flex items-center justify-between h-full">
        {/* Logo - Visible on mobile only */}
        <div className="flex items-center lg:hidden">
          <Image 
            width={90} 
            height={40} 
            src="/logo.png" 
            alt="Edutainment logo"
            className="object-contain"
          />
        </div>

        {/* Desktop: Empty space to push avatar to right */}
        <div className="hidden lg:block flex-1"></div>

        {/* Right side - User info and mobile menu */}
        <div className="flex items-center space-x-4">
          {/* User Avatar - Visible on desktop */}
          <div className="hidden lg:flex items-center gap-x-2">
            <AvatarComponent name={name} src={src} />
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={handleMenuClick}
            className="lg:hidden relative z-50 p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Toggle mobile menu"
          >
            {visible ? <XIcon size={24} /> : <MenuIcon size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence mode="wait">
        {visible && (
          <motion.div
            className="lg:hidden fixed inset-0 top-16 bg-blue-600 z-[9999] overflow-hidden"
            initial={{ x: -400 }}
            animate={{ 
              x: 0,
              transition: { type: "tween", duration: 0.3 }
            }}
            exit={{ 
              x: -400,
              transition: { type: "tween", duration: 0.3 }
            }}
          >
            <div className="flex flex-col h-full min-h-0">
              {/* User Info Section */}
              <div className="flex-shrink-0 p-6 border-b border-blue-500">
                <div className="flex items-center gap-3">
                  <AvatarComponent name={name} src={src} />
                  <div className="text-white">
                    <p className="font-medium">{name}</p>
                  </div>
                </div>
              </div>

              {/* Menu Items - Scrollable if needed */}
              <div className="flex-1 overflow-y-auto p-4">
                {/* Add mobile menu items here if needed */}
                <div className="text-white/80 text-sm">
                  <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-3 w-full p-4 text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors font-medium"
                >
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
                </div>
              </div>

              {/* Logout Button - Always visible at bottom */}
              <div className="flex-shrink-0 p-4 border-t border-blue-500 bg-blue-600">
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-3 w-full p-4 text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors font-medium"
                >
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
