'use client';

import { startTransition, useState } from 'react';
import { Check } from 'lucide-react';

import { toast } from 'sonner';
import { UserDetail } from '@/src/entities/models/user';
import { useRouter } from 'next/navigation';
import { getDetails } from '@/app/dashboard/_services/user.services';
import { Card } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { createSubscriptionPlan, createTransaction } from '../action';
import { reload } from '@/action/action';

const subscriptionOptions = [
  { months: 0, label: 'Free Plan', price: 0 },
  { months: 1, label: '1 Month', price: 1000 },
  { months: 3, label: '3 Months', price: 3000 },
  { months: 6, label: '6 Months', price: 6000 },
  { months: 12, label: '1 Year', price: 12000 },
];

const features = {
  free: ['No offline download', 'Live classes for 5 minutes', 'No submissions'],
  paid: [
    'Unlimited offline download',
    'Priority Support',
    'Unlimited access to live classes',
    'Unlimited submissions',
  ],
};

export default function SubscriptionComponent({
  subscriptionPlan,
  wallet,
  id,
}: UserDetail) {
  const router = useRouter();
  const index = subscriptionOptions.findIndex(
    (sub) => sub.price === subscriptionPlan?.price
  );

  const [selectedOption, setSelectedOption] = useState(index < 0 ? 0 : index);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (selectedOption === 0) {
      toast.warning('You are already on the Free Plan.');
      return;
    }

    const selectedPlan = subscriptionOptions.find(
      (option) => option.months === selectedOption
    );
    if (!selectedPlan) return;

    const balance = (wallet?.amount ?? 0) - selectedPlan.price;

    if (balance < 0) {
      toast.error('Insufficient balance. Please top up to subscribe.', {
        action: {
          label: 'Go Home',
          onClick: () => {
            // start showing the loading bar
            ; (window as any).__showTopProgress?.()
              ; (window as any).__showOverlayLoading?.()
            // perform the navigation
            startTransition(() => {
              router.push('/dashboard/home')
            })
          },
        },
      });
      return;
    }

    try {
      setLoading(true);

      await Promise.all([
        createSubscriptionPlan({
          userId: id,
          name: selectedPlan.label,
          price: selectedPlan.price,
          expiresAt: new Date(
            Date.now() + selectedPlan.months * 30 * 24 * 60 * 60 * 1000
          ),
        }),
        createTransaction({
          userId: id,
          type: 'SUBSCRIPTION',
          amount: selectedPlan.price,
          status: 'PAID',
          message: `${selectedPlan.months} Month(s) Subscription Successful`,
        }),
      ]);

      reload(`/dashboard/subscription`);

      toast.success('Subscription Successful');
      ; (window as any).__showTopProgress?.()
        ; (window as any).__showOverlayLoading?.()
      // perform the navigation
      startTransition(() => {
        router.push('/dashboard/home')
      })

    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Failed to subscribe. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const renderFeatures = (selected: boolean, list: string[]) => (
    <ul className="space-y-2 mt-3 text-sm">
      {list.map((feature, idx) => (
        <li key={idx} className="flex items-center gap-2">
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center ${selected ? 'bg-white text-indigo-600' : 'bg-indigo-600 text-white'
              }`}
          >
            <Check className="w-3 h-3" />
          </div>
          <span className={selected ? 'text-white' : 'text-gray-700'}>
            {feature}
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Choose a Plan</h1>

      <div className="space-y-6">
        {subscriptionOptions.map((option) => {
          const isSelected = selectedOption === option.months;
          const isFree = option.months === 0;

          return (
            <Card
              key={option.months}
              className={`p-6 cursor-pointer transition border-2 ${isSelected
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white border-gray-200'
                }`}
              onClick={() => setSelectedOption(option.months)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">{option.label}</h2>
                  {!isFree && (
                    <p className="text-lg mt-1">
                      ₦{option.price.toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="w-6 h-6 rounded-full border-2 border-white bg-indigo-600" />
              </div>
              <p
                className={`text-sm mt-2 ${isSelected ? 'text-white' : 'text-gray-500'
                  }`}
              >
                Enjoy complete access to Edutainment features for{' '}
                {isFree ? 'Unlimited time' : option.label.toLowerCase()}.
              </p>

              {renderFeatures(
                isSelected,
                isFree ? features.free : features.paid
              )}
            </Card>
          );
        })}
      </div>

      <div className="mt-6">
        <Button
          disabled={loading}
          onClick={handleSubscribe}
          className="w-full text-white bg-indigo-600 hover:bg-indigo-700"
        >
          {loading ? 'Subscribing...' : 'Subscribe Now'}
        </Button>
      </div>
    </div>
  );
}
