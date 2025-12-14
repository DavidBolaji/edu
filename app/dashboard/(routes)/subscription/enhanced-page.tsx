import { getDetails } from '../../_services/user.services';
import { getSubscriptionDetails } from './enhanced-action';
import EnhancedSubscriptionComponent from './_components/enhanced-subscription-component';

export const revalidate = 0;

export default async function EnhancedSubscriptionPage() {
  try {
    const user = await getDetails();
    const subscriptionData = await getSubscriptionDetails(user.id);
    
    if (!subscriptionData.success) {
      throw new Error('Failed to load subscription data');
    }

    return (
      <div className="container mx-auto">
        <EnhancedSubscriptionComponent
          id={user.id}
          subscriptionPlan={subscriptionData.subscriptionPlan ? {
            ...subscriptionData.subscriptionPlan,
            originalPrice: subscriptionData.subscriptionPlan.originalPrice ?? undefined,
            discountPercent: subscriptionData.subscriptionPlan.discountPercent ?? undefined,
            maxDownloads: subscriptionData.subscriptionPlan.maxDownloads ?? undefined,
            maxLiveClasses: subscriptionData.subscriptionPlan.maxLiveClasses ?? undefined,
            lastRenewalDate: subscriptionData.subscriptionPlan.lastRenewalDate ?? undefined,
            nextBillingDate: subscriptionData.subscriptionPlan.nextBillingDate ?? undefined,
            gracePeriodEnds: subscriptionData.subscriptionPlan.gracePeriodEnds ?? undefined,
            cancelledAt: subscriptionData.subscriptionPlan.cancelledAt ?? undefined,
            cancellationReason: subscriptionData.subscriptionPlan.cancellationReason ?? undefined,
            trialEndsAt: subscriptionData.subscriptionPlan.trialEndsAt ?? undefined,
          } : undefined}
          subscriptionUsage={subscriptionData.subscriptionUsage || undefined}
          wallet={subscriptionData.wallet || undefined}
        />
      </div>
    );
  } catch (error) {
    console.error('Subscription page error:', error);
    
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Subscription</h1>
          <p className="text-gray-600 mb-4">
            We encountered an issue loading your subscription details. Please try again later.
          </p>
          <p className="text-sm text-gray-500">
            Error: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }
}