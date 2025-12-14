'use client';

import { startTransition, useState, useEffect } from 'react';
import { Check, Clock, Download, Video, AlertCircle, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Card } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { Badge } from '@/app/_components/ui/badge';
import { Progress } from '@/app/_components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_components/ui/tabs';

interface SubscriptionPlan {
  id: string;
  name: string;
  userId: string;
  price: number;
  originalPrice?: number | null;
  discountPercent?: number | null;
  expiresAt: Date;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'SUSPENDED' | 'TRIAL' | 'GRACE_PERIOD' | 'PENDING_RENEWAL';
  autoRenew: boolean;
  planType: 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'LIFETIME';
  maxDownloads?: number | null;
  maxLiveClasses?: number | null;
  features?: any;
  lastRenewalDate?: Date | null;
  nextBillingDate?: Date | null;
  gracePeriodEnds?: Date | null;
  cancelledAt?: Date | null;
  cancellationReason?: string | null;
  trialEndsAt?: Date | null;
  isTrialActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface SubscriptionUsage {
  id: string;
  userId: string;
  month: Date;
  downloadsUsed: number;
  liveClassesUsed: number;
  lastResetDate: Date;
}

interface UserDetail {
  id: string;
  subscriptionPlan?: SubscriptionPlan;
  subscriptionUsage?: SubscriptionUsage;
  wallet?: { amount: number };
}

const subscriptionPlans = [
  {
    id: 'free',
    name: 'Free Plan',
    price: 0,
    planType: 'MONTHLY' as const,
    maxDownloads: 5,
    maxLiveClasses: 1,
    features: ['5 downloads per month', '1 live class per month', 'Basic support'],
    popular: false,
  },
  {
    id: 'basic',
    name: 'Basic Plan',
    price: 1000,
    originalPrice: 1200,
    planType: 'MONTHLY' as const,
    maxDownloads: 50,
    maxLiveClasses: 10,
    features: ['50 downloads per month', '10 live classes per month', 'Priority support', 'Offline access'],
    popular: false,
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    price: 2500,
    originalPrice: 3000,
    planType: 'MONTHLY' as const,
    maxDownloads: null, // Unlimited
    maxLiveClasses: null, // Unlimited
    features: ['Unlimited downloads', 'Unlimited live classes', '24/7 support', 'Advanced analytics', 'Early access to features'],
    popular: true,
  },
  {
    id: 'yearly',
    name: 'Yearly Premium',
    price: 25000,
    originalPrice: 36000,
    planType: 'YEARLY' as const,
    maxDownloads: null,
    maxLiveClasses: null,
    features: ['Everything in Premium', '2 months free', 'Priority customer success', 'Custom integrations'],
    popular: false,
  },
];

export default function EnhancedSubscriptionComponent({ 
  subscriptionPlan, 
  subscriptionUsage,
  wallet, 
  id 
}: UserDetail) {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string>('free');
  const [loading, setLoading] = useState(false);
  const [showTrialOffer, setShowTrialOffer] = useState(false);

  useEffect(() => {
    // Show trial offer for new users without subscription
    if (!subscriptionPlan && !localStorage.getItem('trial-offered')) {
      setShowTrialOffer(true);
    }
  }, [subscriptionPlan]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { color: 'bg-green-100 text-green-800', label: 'Active' },
      TRIAL: { color: 'bg-blue-100 text-blue-800', label: 'Trial' },
      EXPIRED: { color: 'bg-red-100 text-red-800', label: 'Expired' },
      CANCELLED: { color: 'bg-gray-100 text-gray-800', label: 'Cancelled' },
      GRACE_PERIOD: { color: 'bg-yellow-100 text-yellow-800', label: 'Grace Period' },
      SUSPENDED: { color: 'bg-orange-100 text-orange-800', label: 'Suspended' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.EXPIRED;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getDaysRemaining = () => {
    if (!subscriptionPlan) return 0;
    const now = new Date();
    const expiryDate = subscriptionPlan.gracePeriodEnds || subscriptionPlan.expiresAt;
    return Math.max(0, Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const getUsagePercentage = (used: number, limit: number | null | undefined) => {
    if (limit === null || limit === undefined) return 0; // Unlimited
    return Math.min(100, (used / limit) * 100);
  };

  const handleSubscribe = async (planId: string) => {
    const plan = subscriptionPlans.find(p => p.id === planId);
    if (!plan || plan.id === 'free') return;

    const balance = (wallet?.amount ?? 0) - plan.price;
    if (balance < 0) {
      toast.error('Insufficient balance. Please top up to subscribe.');
      return;
    }

    try {
      setLoading(true);
      
      const { createEnhancedSubscription } = await import('../enhanced-action');
      await createEnhancedSubscription({
        userId: id,
        planId: planId,
        paymentMethod: 'wallet'
      });
      
      toast.success('Subscription successful!');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to subscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrial = async () => {
    try {
      setLoading(true);
      
      const { startTrialSubscription } = await import('../enhanced-action');
      await startTrialSubscription({ userId: id, trialDays: 7 });
      
      localStorage.setItem('trial-offered', 'true');
      setShowTrialOffer(false);
      toast.success('7-day free trial started!');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start trial. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscriptionPlan) return;
    
    try {
      setLoading(true);
      
      const { cancelSubscription } = await import('../enhanced-action');
      await cancelSubscription({ userId: id, reason: 'User requested' });
      
      toast.success('Subscription cancelled. You can continue using until expiry.');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel subscription.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
        <p className="text-gray-600">Unlock the full potential of your learning experience</p>
      </div>

      {/* Trial Offer Modal */}
      {showTrialOffer && (
        <Card className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center gap-4">
            <Gift className="w-12 h-12 text-blue-600" />
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-blue-900">Start Your Free Trial!</h3>
              <p className="text-blue-700">Get 7 days of Premium access absolutely free. No credit card required.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowTrialOffer(false)}>
                Maybe Later
              </Button>
              <Button onClick={handleStartTrial} disabled={loading}>
                Start Free Trial
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Tabs defaultValue="plans" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="plans">Available Plans</TabsTrigger>
          <TabsTrigger value="current">Current Subscription</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {subscriptionPlans.map((plan) => {
              const isCurrentPlan = subscriptionPlan?.name === plan.name;
              const discount = plan.originalPrice ? Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100) : 0;

              return (
                <Card
                  key={plan.id}
                  className={`relative p-6 cursor-pointer transition-all hover:shadow-lg ${
                    plan.popular ? 'ring-2 ring-indigo-500 scale-105' : ''
                  } ${isCurrentPlan ? 'bg-indigo-50 border-indigo-200' : ''}`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white">
                      Most Popular
                    </Badge>
                  )}
                  
                  <div className="text-center">
                    <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                    
                    <div className="mb-4">
                      {plan.originalPrice && (
                        <div className="text-sm text-gray-500 line-through">
                          ₦{plan.originalPrice.toLocaleString()}
                        </div>
                      )}
                      <div className="text-3xl font-bold">
                        {plan.price === 0 ? 'Free' : `₦${plan.price.toLocaleString()}`}
                      </div>
                      {discount > 0 && (
                        <Badge className="mt-1 bg-green-100 text-green-800">
                          {discount}% OFF
                        </Badge>
                      )}
                      <div className="text-sm text-gray-500">
                        {plan.planType === 'YEARLY' ? 'per year' : 'per month'}
                      </div>
                    </div>

                    <ul className="space-y-2 mb-6 text-sm">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className="w-full"
                      variant={plan.popular ? 'default' : 'outline'}
                      disabled={loading || isCurrentPlan}
                      onClick={() => handleSubscribe(plan.id)}
                    >
                      {isCurrentPlan ? 'Current Plan' : loading ? 'Processing...' : 'Select Plan'}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="current" className="space-y-6">
          {subscriptionPlan ? (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Current Plan Info */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Current Plan</h3>
                  {getStatusBadge(subscriptionPlan.status)}
                </div>
                
                <div className="space-y-3">
                  <div>
                    <span className="font-medium">{subscriptionPlan.name}</span>
                    <div className="text-2xl font-bold">₦{subscriptionPlan.price.toLocaleString()}</div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>
                      {getDaysRemaining()} days remaining
                      {subscriptionPlan.gracePeriodEnds && ' (Grace Period)'}
                    </span>
                  </div>
                  
                  <div className="text-sm">
                    <div>Expires: {subscriptionPlan.expiresAt.toLocaleDateString()}</div>
                    {subscriptionPlan.nextBillingDate && (
                      <div>Next billing: {subscriptionPlan.nextBillingDate.toLocaleDateString()}</div>
                    )}
                  </div>

                  {subscriptionPlan.autoRenew && subscriptionPlan.status === 'ACTIVE' && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <Check className="w-4 h-4" />
                      <span>Auto-renewal enabled</span>
                    </div>
                  )}

                  {subscriptionPlan.cancelledAt && (
                    <div className="text-sm text-orange-600">
                      <AlertCircle className="w-4 h-4 inline mr-1" />
                      Cancelled on {subscriptionPlan.cancelledAt.toLocaleDateString()}
                      {subscriptionPlan.cancellationReason && (
                        <div className="mt-1">Reason: {subscriptionPlan.cancellationReason}</div>
                      )}
                    </div>
                  )}
                </div>

                {subscriptionPlan.status === 'ACTIVE' && !subscriptionPlan.cancelledAt && (
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={handleCancelSubscription}
                    disabled={loading}
                  >
                    Cancel Subscription
                  </Button>
                )}
              </Card>

              {/* Usage Statistics */}
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Usage This Month</h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        <span>Downloads</span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {subscriptionUsage?.downloadsUsed || 0}
                        {subscriptionPlan.maxDownloads ? ` / ${subscriptionPlan.maxDownloads}` : ' / Unlimited'}
                      </span>
                    </div>
                    <Progress 
                      value={getUsagePercentage(subscriptionUsage?.downloadsUsed || 0, subscriptionPlan.maxDownloads)} 
                      className="h-2"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4" />
                        <span>Live Classes</span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {subscriptionUsage?.liveClassesUsed || 0}
                        {subscriptionPlan.maxLiveClasses ? ` / ${subscriptionPlan.maxLiveClasses}` : ' / Unlimited'}
                      </span>
                    </div>
                    <Progress 
                      value={getUsagePercentage(subscriptionUsage?.liveClassesUsed || 0, subscriptionPlan.maxLiveClasses)} 
                      className="h-2"
                    />
                  </div>
                </div>

                <div className="mt-4 text-sm text-gray-600">
                  Usage resets on the 1st of each month
                </div>
              </Card>
            </div>
          ) : (
            <Card className="p-8 text-center">
              <h3 className="text-xl font-semibold mb-2">No Active Subscription</h3>
              <p className="text-gray-600 mb-4">
                You&apos;re currently on the free plan. Upgrade to unlock premium features.
              </p>
              <Button onClick={() => setSelectedPlan('premium')}>
                View Plans
              </Button>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}