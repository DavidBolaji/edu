import React from 'react';
import { useWalletContext } from './wallet-context';

const WalletAmount: React.FC<{ amount: number }> = ({ amount }) => {
  const { isAmountVisible } = useWalletContext();
  return (
    <div className="text-white text-xl font-bold mb-2">
      {isAmountVisible
        ? new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(amount || 0)
        : '•••• •••• •••• ••••'}
    </div>
  );
};

export default WalletAmount;
