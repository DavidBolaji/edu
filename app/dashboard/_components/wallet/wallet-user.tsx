import React from 'react';
import TopUp from './topup';
import { UserDetail } from '@/src/entities/models/user';

const WalletUser: React.FC<{ user: UserDetail }> = ({ user }) => {
  return (
    <div className="flex justify-between items-end">
      <div>
        <div className="text-white text-xs opacity-70">CARD HOLDER</div>
        <div className="text-white text-sm">{`${user?.fname} ${user?.lname}`}</div>
      </div>
      <TopUp {...user} />
    </div>
  );
};

export default WalletUser;
