'use client';
import { Eye, EyeOff } from 'lucide-react';
import React from 'react';
import { useWalletContext } from './wallet-context';

const WalletTogglePrice = () => {
  const { toggleVisible, isAmountVisible } = useWalletContext();
  return (
    <button onClick={toggleVisible} className="text-white">
      {isAmountVisible ? <Eye /> : <EyeOff />}
    </button>
  );
};

export default WalletTogglePrice;
