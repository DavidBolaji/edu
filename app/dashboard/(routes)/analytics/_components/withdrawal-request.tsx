'use client';

import React, { useState } from 'react';
import { Button } from '@/app/_components/ui/button';
import { Card } from '@/app/_components/ui/card';
import { Input } from '@/app/_components/ui/input';
import { Label } from '@/app/_components/ui/label';
import { toast } from 'sonner';
import { Wallet, AlertCircle, CheckCircle } from 'lucide-react';
import { createWithdrawalRequest, getUserWithdrawalRequests } from '../actions/withdrawal.action';
import { useEffect } from 'react';

interface WithdrawalRequestProps {
  accruedAmount: number;
  onRequestSubmitted?: () => void;
}

interface PendingRequest {
  id: string;
  amount: number;
  status: string;
  requestedAt: string;
}

export function WithdrawalRequest({ accruedAmount, onRequestSubmitted }: WithdrawalRequestProps) {
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<PendingRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [bankAccount, setBankAccount] = useState<any>(null);
  const [hasBankAccount, setHasBankAccount] = useState(false);

  // Check for pending requests and bank account on component mount
  useEffect(() => {
    const checkData = async () => {
      try {
        // Check pending requests
        const withdrawalResult = await getUserWithdrawalRequests();
        if (withdrawalResult.success && withdrawalResult.data) {
          const pending = withdrawalResult.data.find((req: any) => 
            req.status === 'PENDING' || req.status === 'APPROVED'
          );
          if (pending) {
            setPendingRequest({
              id: pending.id,
              amount: pending.amount,
              status: pending.status,
              requestedAt: pending.requestedAt.toString()
            });
          }
        }

        // Check bank account
        const bankResult = await fetch('/api/user/bank-account');
        const bankData = await bankResult.json();
        if (bankData.success && bankData.bankAccount) {
          setBankAccount(bankData.bankAccount);
          setHasBankAccount(true);
        }
      } catch (error) {
        console.error('Error checking data:', error);
      } finally {
        setLoading(false);
      }
    };

    checkData();
  }, []);

  // Calculate available balance (total - pending amount)
  const availableBalance = pendingRequest 
    ? Math.max(0, accruedAmount - pendingRequest.amount)
    : accruedAmount;

  const hasPendingRequest = !!pendingRequest;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasBankAccount) {
      toast.error('Please add your bank account details first');
      return;
    }
    
    const requestAmount = parseFloat(amount);
    
    if (!requestAmount || requestAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (requestAmount > availableBalance) {
      toast.error('Amount cannot exceed available balance');
      return;
    }

    if (requestAmount < 600) {
      toast.error('Minimum withdrawal amount is ₦600');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createWithdrawalRequest(requestAmount);
      
      if (result.success && result.data) {
        toast.success('Withdrawal request submitted successfully');
        setAmount('');
        // Update pending request state
        setPendingRequest({
          id: result.data.id,
          amount: requestAmount,
          status: 'PENDING',
          requestedAt: new Date().toISOString()
        });
        onRequestSubmitted?.();
      } else {
        toast.error(result.error || 'Failed to submit withdrawal request');
      }
    } catch (error) {
      toast.error('An error occurred while submitting request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-3 sm:p-6 mt-6 w-full overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <Wallet className="h-5 w-5 text-green-600" />
        <h3 className="text-base sm:text-lg font-semibold">Request Withdrawal</h3>
      </div>

      {loading ? (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
            <span className="text-sm text-gray-600">Checking withdrawal status...</span>
          </div>
        </div>
      ) : (
        <>
          {hasPendingRequest && (
            <div className={`mb-4 p-4 rounded-lg border ${
              pendingRequest!.status === 'APPROVED' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-start gap-2">
                <AlertCircle className={`h-5 w-5 mt-0.5 ${
                  pendingRequest!.status === 'APPROVED' 
                    ? 'text-green-600' 
                    : 'text-yellow-600'
                }`} />
                <div className={`text-sm ${
                  pendingRequest!.status === 'APPROVED' 
                    ? 'text-green-800' 
                    : 'text-yellow-800'
                }`}>
                  <p className="font-medium mb-1">
                    {pendingRequest!.status === 'APPROVED' ? 'Approved' : 'Pending'} Withdrawal: ₦{pendingRequest!.amount.toFixed(2)}
                  </p>
                  <p>
                    {pendingRequest!.status === 'APPROVED' 
                      ? 'Your withdrawal has been approved and will be processed soon. New requests cannot be made until this is completed.'
                      : 'You have a pending withdrawal request. New requests cannot be made until this is processed.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Bank Account Status */}
          {hasBankAccount ? (
            <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="text-sm text-green-800">
                  <p className="font-medium mb-1">Payment Details Configured</p>
                  <p className="text-xs break-words">
                    {bankAccount?.bankName} • {bankAccount?.accountNumber} • {bankAccount?.accountName}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-medium mb-1">Bank Account Required</p>
                  <p>Please add your bank account details below to enable withdrawals</p>
                </div>
              </div>
            </div>
          )}

          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">
                  Total Balance: ₦{accruedAmount.toFixed(2)}
                  {hasPendingRequest && (
                    <span className="block">Available Balance: ₦{availableBalance.toFixed(2)}</span>
                  )}
                </p>
                <p>Minimum withdrawal: ₦600 • Processing time: 3-5 business days</p>
              </div>
            </div>
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="amount">Withdrawal Amount (₦)</Label>
          <Input
            id="amount"
            type="number"
            min="600"
            max={availableBalance}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount to withdraw"
            className="mt-1"
            disabled={hasPendingRequest || loading}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setAmount(Math.min(availableBalance, 600).toString())}
            disabled={availableBalance < 600 || hasPendingRequest || loading}
            className="text-xs w-full sm:w-auto"
          >
            Min (₦600)
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setAmount(availableBalance.toString())}
            disabled={availableBalance < 600 || hasPendingRequest || loading}
            className="text-xs w-full sm:w-auto"
          >
            Max Available
          </Button>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || availableBalance < 600 || hasPendingRequest || loading || !hasBankAccount}
          className="w-full"
        >
          {!hasBankAccount
            ? 'Add Bank Account First'
            : hasPendingRequest 
            ? 'Withdrawal Request Pending' 
            : isSubmitting 
            ? 'Submitting...' 
            : 'Submit Withdrawal Request'
          }
        </Button>
      </form>

      {!hasPendingRequest && availableBalance < 600 && (
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center gap-2 text-yellow-800 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>You need at least ₦600 to request a withdrawal</span>
          </div>
        </div>
      )}
    </Card>
  );
}