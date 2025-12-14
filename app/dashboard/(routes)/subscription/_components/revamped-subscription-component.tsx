'use client';

import { useState } from 'react';
import { Check, Clock, Download, Video, AlertCircle, Crown, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Card } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { Badge } from '@/app/_components/ui/badge';
import { Progress } from '@/app/_components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_components/ui/tabs';
import { Input } from '@/app/_components/ui/input';
import { Label } from '@/app/_components/ui/label';
import { Switch } from '@/app/_components/ui/switch';

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
  planType: 'MONTHLY' | 'YEARLY';
  isYearly: boolean;
  monthsPaid: number;
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

const MONTHLY_PRICE = 1000;
const YEARLY_PRICE = 12000;

export default function RevampedSubscriptionComponent({ 
  subscriptionPlan, 
  subscriptionUsage,
  wallet, 
  id 
}: UserDetail) {
  const router = useRouter();
  const [isYearly, setIsYearly] = useState(false);
  const [customMonths, setCustomMonths] = useState(1);
  const [loading, setLoading] = useState(false);

  const calculatePrice = () => {
    if (isYearly) {
      return YEARLY_PRICE;
    }
    return MONTHLY_PRICE * customMonths;
  };

  const calculateSavings = () => {
    if (isYearly) {
      return (MONTHLY_PRICE * 12) - YEARLY_PRICE;
    }
    return 0;
  };

  // Helper function to check if user has any premium subscription (regardless of plan type)
  const hasAnyPremiumSubscription = () => {
    return subscriptionPlan?.name === 'Premium' && subscriptionPlan?.status === 'ACTIVE';
  };

  // Helper function to get the current subscription plan type description
  const getCurrentPlanTypeDescription = () => {
    if (!subscriptionPlan || subscriptionPlan.name === 'Free') return null;
    return subscriptionPlan.isYearly ? 'Yearly Premium' : 'Monthly Premium';
  };

  const getStatusBadge = (status: string, cancelledAt?: Date | null) => {
    // If subscription is cancelled but still active, show special status
    if (status === 'ACTIVE' && cancelledAt) {
      return <Badge className="bg-orange-100 text-orange-800 text-nowrap">Cancelled - Active Until Expiry</Badge>;
    }
    
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

  const handleSubscribe = async (planType: 'free' | 'premium') => {
    if (planType === 'free') {
      await handleDowngradeToFree();
      return;
    }

    const totalPrice = calculatePrice();
    const balance = (wallet?.amount ?? 0) - totalPrice;
    
    if (balance < 0) {
      toast.error(`Insufficient balance. You need ₦${Math.abs(balance).toLocaleString()} more to subscribe.`);
      return;
    }

    try {
      setLoading(true);
      
      const { createRevampedSubscription } = await import('../revamped-action');
      await createRevampedSubscription({
        userId: id,
        planType: 'premium',
        isYearly,
        months: isYearly ? 12 : customMonths,
        paymentMethod: 'wallet'
      });
      
      // Check if this was a reactivation of the same plan type
      const wasReactivation = subscriptionPlan?.name === 'Premium' && 
                             subscriptionPlan?.cancelledAt &&
                             subscriptionPlan?.isYearly === isYearly;
      
      const successMessage = wasReactivation
        ? `${isYearly ? 'Yearly' : 'Monthly'} subscription reactivated successfully!` 
        : `${isYearly ? 'Yearly' : 'Monthly'} subscription created successfully!`;
      toast.success(successMessage);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to subscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscriptionPlan) return;
    
    try {
      setLoading(true);
      
      const { cancelRevampedSubscription } = await import('../revamped-action');
      await cancelRevampedSubscription({ userId: id, reason: 'User requested' });
      
      toast.success('Subscription cancelled. You can continue using until expiry.');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel subscription.');
    } finally {
      setLoading(false);
    }
  };

  const handleDowngradeToFree = async () => {
    if (!subscriptionPlan || subscriptionPlan.name === 'Free') {
      toast.info('You are already on the free plan');
      return;
    }
    
    try {
      setLoading(true);
      
      const { downgradeToFree } = await import('../revamped-action');
      await downgradeToFree(id);
      
      toast.success('Downgraded to free plan. Premium features will remain active until expiry.');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to downgrade. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Check if user has active premium subscription matching current toggle
  const isPremiumUser = subscriptionPlan?.name === 'Premium' && 
                       subscriptionPlan?.status === 'ACTIVE' && 
                       !subscriptionPlan?.cancelledAt &&
                       subscriptionPlan?.isYearly === isYearly;
  
  const isFreeUser = !subscriptionPlan || subscriptionPlan?.name === 'Free';
  
  // Check if user has cancelled premium subscription matching current toggle
  const isCancelledPremium = subscriptionPlan?.name === 'Premium' && 
                            subscriptionPlan?.status === 'ACTIVE' && 
                            subscriptionPlan?.cancelledAt &&
                            subscriptionPlan?.isYearly === isYearly;

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
        <p className="text-gray-600">Simple pricing for everyone. Free or Premium.</p>
      </div>

      <Tabs defaultValue="plans" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="plans">Available Plans</TabsTrigger>
          <TabsTrigger value="current">Current Subscription</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-6">
          {/* Billing Toggle */}
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="flex items-center gap-4">
              <span className={`text-sm ${!isYearly ? 'font-semibold' : 'text-gray-500'}`}>Monthly</span>
              <Switch
                checked={isYearly}
                onCheckedChange={setIsYearly}
                className="data-[state=checked]:bg-indigo-600"
              />
              <span className={`text-sm ${isYearly ? 'font-semibold' : 'text-gray-500'}`}>Yearly</span>
              {isYearly && (
                <Badge className="bg-green-100 text-green-800 ml-2">
                  Save ₦{calculateSavings().toLocaleString()}
                </Badge>
              )}
            </div>
            
            {/* Show current subscription info when toggling */}
            {hasAnyPremiumSubscription() && (
              <div className="text-sm text-gray-600 text-center">
                <span>Your current subscription: </span>
                <span className="font-medium">{getCurrentPlanTypeDescription()}</span>
                {subscriptionPlan?.cancelledAt && (
                  <span className="text-orange-600 ml-1">(Cancelled)</span>
                )}
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <Card className={`p-6 ${isFreeUser ? 'ring-2 ring-gray-300 bg-gray-50' : ''}`}>
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-gray-600" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Free</h3>
                <div className="text-3xl font-bold mb-4">₦0</div>
                <p className="text-gray-600 mb-6">Perfect for getting started</p>

                <ul className="space-y-3 mb-8 text-left">
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>5 downloads per month</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>1 live class per month</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Basic support</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Access to all courses</span>
                  </li>
                </ul>

                <Button
                  variant="outline"
                  className="w-full"
                  disabled={isFreeUser || loading}
                  onClick={() => handleSubscribe('free')}
                >
                  {isFreeUser ? 'Current Plan' : loading ? 'Processing...' : 'Downgrade to Free'}
                </Button>
              </div>
            </Card>

            {/* Premium Plan */}
            <Card className={`p-6 relative ${isPremiumUser ? 'ring-2 ring-indigo-500 bg-indigo-50' : isCancelledPremium ? 'ring-2 ring-orange-300 bg-orange-50' : 'ring-2 ring-indigo-200'}`}>
              {isPremiumUser && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white">
                  Current Plan
                </Badge>
              )}
              {isCancelledPremium && (
                <Badge className="absolute text-nowrap -top-2 left-1/2 transform -translate-x-1/2 bg-orange-600 text-white">
                  Cancelled - Active Until Expiry
                </Badge>
              )}
              {!isPremiumUser && !isCancelledPremium && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white">
                  Most Popular
                </Badge>
              )}
              
              <div className="text-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Premium</h3>
                <div className="text-3xl font-bold mb-1">
                  ₦{isYearly ? YEARLY_PRICE.toLocaleString() : MONTHLY_PRICE.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 mb-4">
                  {isYearly ? 'per year' : 'per month'}
                </div>
                
                {!isYearly && (
                  <div className="mb-4">
                    <Label htmlFor="months" className="text-sm font-medium">
                      Number of months (1-12):
                    </Label>
                    <Input
                      id="months"
                      type="number"
                      min="1"
                      max="12"
                      value={customMonths}
                      onChange={(e) => setCustomMonths(Math.max(1, Math.min(12, parseInt(e.target.value) || 1)))}
                      className="mt-1 text-center"
                    />
                    <div className="text-sm text-gray-600 mt-1">
                      Total: ₦{calculatePrice().toLocaleString()}
                    </div>
                  </div>
                )}

                <p className="text-gray-600 mb-6">Everything you need to excel</p>

                <ul className="space-y-3 mb-8 text-left">
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Unlimited downloads</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Unlimited live classes</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Priority support</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Offline access</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Advanced analytics</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Early access to features</span>
                  </li>
                </ul>

                <Button
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  disabled={loading || isPremiumUser}
                  onClick={() => handleSubscribe('premium')}
                >
                  {isPremiumUser ? 'Current Plan' : 
                   isCancelledPremium ? `Reactivate ${isYearly ? 'Yearly' : 'Monthly'} Premium` : 
                   loading ? 'Processing...' : 
                   `Upgrade to ${isYearly ? 'Yearly' : 'Monthly'} Premium`}
                </Button>

                <div className="mt-4 text-xs text-gray-500">
                  Wallet Balance: ₦{(wallet?.amount ?? 0).toLocaleString()}
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="current" className="space-y-6">
          {subscriptionPlan ? (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Current Plan Info */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Current Plan</h3>
                  {getStatusBadge(subscriptionPlan.status, subscriptionPlan.cancelledAt)}
                </div>
                
                <div className="space-y-3">
                  <div>
                    <span className="font-medium">{subscriptionPlan.name}</span>
                    <div className="text-2xl font-bold">₦{subscriptionPlan.price.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">
                      {subscriptionPlan.isYearly ? 'Yearly billing' : `${subscriptionPlan.monthsPaid} month(s) paid`}
                    </div>
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

                {subscriptionPlan.status === 'ACTIVE' && subscriptionPlan.name === 'Premium' && (
                  <div className="mt-4 space-y-2">
                    {!subscriptionPlan.cancelledAt ? (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleCancelSubscription}
                        disabled={loading}
                      >
                        Cancel Subscription
                      </Button>
                    ) : (
                      <div className="text-center">
                        <p className="text-sm text-orange-600 mb-2">
                          Subscription cancelled - active until {subscriptionPlan.expiresAt.toLocaleDateString()}
                        </p>
                        <Button
                          className="w-full bg-indigo-600 hover:bg-indigo-700"
                          onClick={() => handleSubscribe('premium')}
                          disabled={loading}
                        >
                          Reactivate Subscription
                        </Button>
                      </div>
                    )}
                  </div>
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
              <Button onClick={() => setIsYearly(false)}>
                View Plans
              </Button>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}