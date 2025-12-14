'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { Input } from '@/app/_components/ui/input';
import { Label } from '@/app/_components/ui/label';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle, CreditCard } from 'lucide-react';

interface BankAccountSetupProps {
  onAccountSetup?: () => void;
}

interface BankAccount {
  bankName: string;
  accountNumber: string;
  accountName: string;
  bankCode: string;
}

// Nigerian banks list (you can expand this)
const NIGERIAN_BANKS = [
  { name: 'Access Bank', code: '044' },
  { name: 'Guaranty Trust Bank', code: '058' },
  { name: 'United Bank for Africa', code: '033' },
  { name: 'Zenith Bank', code: '057' },
  { name: 'First Bank of Nigeria', code: '011' },
  { name: 'Fidelity Bank', code: '070' },
  { name: 'Union Bank of Nigeria', code: '032' },
  { name: 'Sterling Bank', code: '232' },
  { name: 'Stanbic IBTC Bank', code: '221' },
  { name: 'Ecobank Nigeria', code: '050' },
  { name: 'Wema Bank', code: '035' },
  { name: 'Polaris Bank', code: '076' },
  { name: 'Keystone Bank', code: '082' },
  { name: 'FCMB', code: '214' },
  { name: 'Jaiz Bank', code: '301' },
  { name: 'Kuda Bank', code: '50211' },
  { name: 'Opay', code: '999992' },
  { name: 'PalmPay', code: '999991' }
];

export function BankAccountSetup({ onAccountSetup }: BankAccountSetupProps) {
  const [bankAccount, setBankAccount] = useState<BankAccount>({
    bankName: '',
    accountNumber: '',
    accountName: '',
    bankCode: ''
  });
  const [existingAccount, setExistingAccount] = useState<BankAccount | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBankAccount();
  }, []);

  const fetchBankAccount = async () => {
    try {
      const response = await fetch('/api/user/bank-account');
      const data = await response.json();
      
      if (data.success && data.bankAccount) {
        setExistingAccount(data.bankAccount);
        setBankAccount(data.bankAccount);
      } else {
        setIsEditing(true); // No account exists, show form
      }
    } catch (error) {
      console.error('Error fetching bank account:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBankChange = (bankName: string) => {
    const selectedBank = NIGERIAN_BANKS.find(bank => bank.name === bankName);
    setBankAccount(prev => ({
      ...prev,
      bankName,
      bankCode: selectedBank?.code || ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bankAccount.bankName || !bankAccount.accountNumber || !bankAccount.accountName) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (bankAccount.accountNumber.length !== 10) {
      toast.error('Account number must be 10 digits');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/user/bank-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bankAccount)
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Bank account details saved successfully');
        setExistingAccount(bankAccount);
        setIsEditing(false);
        onAccountSetup?.();
      } else {
        toast.error(result.error || 'Failed to save bank account details');
      }
    } catch (error) {
      toast.error('An error occurred while saving bank account details');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-3 sm:p-6 mt-6 w-full overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="h-5 w-5 text-blue-600" />
        <h3 className="text-base sm:text-lg font-semibold">Bank Account Details</h3>
      </div>

      {existingAccount && !isEditing ? (
        // Display existing account
        <div className="space-y-4">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="text-sm text-green-800">
                <p className="font-medium mb-1">Bank Account Configured</p>
                <p>Withdrawals will be sent to this account</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Bank Name</p>
              <p className="font-medium break-words">{existingAccount.bankName}</p>
            </div>
            <div>
              <p className="text-gray-600">Account Number</p>
              <p className="font-medium">{existingAccount.accountNumber}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-gray-600">Account Name</p>
              <p className="font-medium break-words">{existingAccount.accountName}</p>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => setIsEditing(true)}
            className="w-full"
          >
            Update Bank Account Details
          </Button>
        </div>
      ) : (
        // Edit/Add form
        <div className="space-y-4">
          {!existingAccount && (
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Bank Account Required</p>
                  <p>Please add your bank account details to enable withdrawals</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="bankName">Bank Name *</Label>
              <select
                id="bankName"
                value={bankAccount.bankName}
                onChange={(e) => handleBankChange(e.target.value)}
                className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select your bank</option>
                {NIGERIAN_BANKS.map((bank) => (
                  <option key={bank.code} value={bank.name}>
                    {bank.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="accountNumber">Account Number *</Label>
              <Input
                id="accountNumber"
                type="text"
                maxLength={10}
                value={bankAccount.accountNumber}
                onChange={(e) => setBankAccount(prev => ({ ...prev, accountNumber: e.target.value.replace(/\D/g, '') }))}
                placeholder="Enter 10-digit account number"
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="accountName">Account Name *</Label>
              <Input
                id="accountName"
                type="text"
                value={bankAccount.accountName}
                onChange={(e) => setBankAccount(prev => ({ ...prev, accountName: e.target.value.toUpperCase() }))}
                placeholder="Enter account name as it appears on your bank statement"
                className="mt-1"
                required
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Saving...' : existingAccount ? 'Update Account' : 'Save Account Details'}
              </Button>
              
              {existingAccount && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setBankAccount(existingAccount);
                  }}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </div>
      )}
    </Card>
  );
}