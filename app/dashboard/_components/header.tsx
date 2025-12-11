'use client';

// import { LOGO_URL } from '@/config';
import { Header } from 'antd/es/layout/layout';
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
    <Header
      style={{
        paddingLeft: 0,
        paddingRight: '40px',
        background: '#fff',
        height: 72,
        borderBottom: '1px solid #DDEEE5',
      }}
    >
      <div className="justify-between items-center w-full space-x-4 h-full hidden px-4">
        <Image width={90} height={40} src={'/logo.png'} alt="Edutainment logo" />
      </div>
      <div className="flex justify-end items-center w-full space-x-4 h-full">
        <div className="items-center gap-x-2 md:flex hidden">
          <AvatarComponent name={name} src={src} />
        </div>
        <div
          onClick={handleMenuClick}
          className="cursor-pointer relative z-50 block lg:hidden"
        >
          <div className="z-50 -transl">
            {visible ? <XIcon color="black" /> : <MenuIcon color="black" />}
          </div>
        </div>
      </div>
      <AnimatePresence mode="wait">
        {visible && (
          <motion.div
            className="bg-blue-700 absolute left-0 top-[9.6%] w-full mt-2 h-[91.5%] z-[9999]"
            initial={{
              x: -700,
            }}
            animate={{
              x: 0,
              transition: { type: "tween" }
              // transition: { type: 'linear' },
            }}
            exit={{
              x: -700,
            }}
          >
            <div className="flex px-4 justify-center items-center">
              <div
                className="flex gap-3 items-center border-white w-full border-b justify-center cursor-default text-white"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                Logout
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Header>
  );
};
