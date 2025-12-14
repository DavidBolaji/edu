import { getDetails } from '../../_services/user.services';
import { getRevampedSubscriptionDetails } from './revamped-action';
import RevampedSubscriptionComponent from './_components/revamped-subscription-component';

export const revalidate = 0;

const SubscriptionPage = async () => {
  try {
    const user = await getDetails();
    const subscriptionData = await getRevampedSubscriptionDetails(user.id);
    
    if (!subscriptionData.success) {
      throw new Error('Failed to load subscription data');
    }

    return (
      <div>
        <RevampedSubscriptionComponent
          id={user.id}
          subscriptionPlan={subscriptionData.subscriptionPlan || undefined}
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
};

export default SubscriptionPage;
