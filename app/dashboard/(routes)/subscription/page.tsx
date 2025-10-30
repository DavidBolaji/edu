import { getDetails } from '../../_services/user.services';
import SubscriptionComponent from './_components/subscription-component';

export const revalidate = 0;

const SubscriptionPage = async () => {
  const user = await getDetails();
  return (
    <div>
      <SubscriptionComponent {...user} />
    </div>
  );
};

export default SubscriptionPage;
