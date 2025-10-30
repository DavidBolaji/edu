'use client';
import { QrCode } from 'lucide-react';
import React from 'react';
import WalletTogglePrice from './wallet-toggle-price';
import { WalletProvider } from './wallet-context';
import WalletAmount from './wallet-amount';
import WalletUser from './wallet-user';
import { UserDetail } from '@/src/entities/models/user';

export const WalletCard: React.FC<{ amount: number; user: UserDetail }> = ({
  amount,
  user,
}) => {
  return (
    <WalletProvider>
      <div className="relative bg-primary max-w-lg bg-opacity-10 opacity-80 backdrop-blur-lg rounded-2xl p-6 shadow h-40 w-full flex flex-col justify-between border border-white border-opacity-30">
        <div className="flex justify-between items-center">
          <QrCode name="qr-code" size={24} color="white" />
          <WalletTogglePrice />
        </div>

        <div>
          <WalletAmount amount={amount} />
          <WalletUser user={user} />
        </div>
      </div>
    </WalletProvider>
  );
};
