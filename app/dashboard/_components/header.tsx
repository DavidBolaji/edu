'use client';

import { LOGO_URL } from '@/config';
import { Header } from 'antd/es/layout/layout';
import Image from 'next/image';
import AvatarComponent from './avatar-component';
import { MenuIcon, XIcon } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

export const DashboardHeader: React.FC<{
  name: string;
  src: string | null;
}> = ({ name, src = null }) => {
  const [visible, setVisible] = useState(false);
  const router = useRouter();

  const handleMenuClick = () => {
    setVisible((prev) => !prev);
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
        <Image width={90} height={40} src={LOGO_URL} alt="Edutainment logo" />
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
            className="bg-[#F1F5F7] absolute left-0 top-[9.6%] w-full mt-2 h-[91.5%] z-[9999]"
            initial={{
              x: -700,
            }}
            animate={{
              x: 0,
              transition: {type: "tween"}
              // transition: { type: 'linear' },
            }}
            exit={{
              x: -700,
            }}
          >
            <div className="flex justify-end items-center"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </Header>
  );
};
