'use client';

import { useState } from 'react';
import { usePaystackPayment } from 'react-paystack';
import { toast } from 'sonner';

import { UserDetail } from '@/src/entities/models/user';
import { createTransaction } from '../../(routes)/subscription/action';
import { Button } from '@/app/_components/ui/button';
import { Input } from '@/app/_components/ui/input';
import { reload } from '@/action/action';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/_components/ui/dialog';

const TopUp: React.FC<UserDetail> = ({ email, id }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC as string;

  const onSuccess = async (reference: string) => {

    try {
      setLoading(true);
      await createTransaction({
        userId: id,
        type: 'TOPUP',
        amount: parseFloat(amount),
        status: 'PAID',
        message: 'User top-up',
      });
      reload('/dashboard/home');
      toast.success('Top-up successful');
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.error || 'Top-up failed');
    } finally {
      setLoading(false);
    }
  };

  const onClose = () => {
    // User closed the Paystack modal
    console.log('Payment closed');
  };

  const initializePayment = usePaystackPayment({
    email: email || '',
    amount: parseFloat(amount) * 100,
    currency: 'NGN',
    publicKey,
  });

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        disabled={loading}
        className="bg-white text-blue-500 text-sm px-2 py-1"
      >
        {loading ? 'Loading...' : 'Top Up'}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Fund Wallet</DialogTitle>
          </DialogHeader>

          <Input
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min={100}
          />

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>

            <Button
              disabled={!amount || loading}
              onClick={() => {
                setIsOpen(false); // 👈 Close immediately
                initializePayment({ onSuccess, onClose }); // 👈 Launch Paystack
              }}
              className="bg-blue-600 text-white"
            >
              Pay Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TopUp;
