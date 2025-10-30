import { getDetails } from '../../_services/user.services';
import PortalComponent from './_components/portal-component';

const PortalPage = async () => {
  const user = await getDetails();
  return (
    <>
      <PortalComponent user={user} />
    </>
  );
};

export default PortalPage;
