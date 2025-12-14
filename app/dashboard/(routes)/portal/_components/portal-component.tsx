'use client';

import { useEffect, useState } from 'react';

import { FormikHelpers } from 'formik';
import { toast } from 'sonner';
import { UserDetail } from '@/src/entities/models/user';
import { PortalForm } from './portal-form';
import { PortalFormValues } from '../_validations/portal-schema';
import { Portal } from './table/schema';
import { PortalList } from './portal-list';
import { createPortal, getPortal } from '../action';

const PortalComponent: React.FC<{ user: UserDetail }> = ({ user }) => {
  const [portals, setPortals] = useState<Portal[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchPortals();
  }, []);

  const fetchPortals = async () => {
    try {
      setIsLoading(true);
      const response = await getPortal();
      const portal = response;
      setPortals(portal as unknown as Portal[]);
    } catch (error) {
      toast.error('Error fetching portals');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (
    values: PortalFormValues,
    { setSubmitting, resetForm }: FormikHelpers<PortalFormValues>
  ) => {
    try {
      await createPortal(values);
      setSubmitting(false);
      resetForm();
      fetchPortals(); // Refresh the list instead of reloading page
      toast.success('Portal created successfully');
    } catch (error) {
      toast.error('Error creating portal');
    }
  };

  const updatePortal = (updatedPortal: Portal) => {
    setPortals(prev => prev.map(portal => 
      portal.id === updatedPortal.id ? updatedPortal : portal
    ));
  };

  const removePortal = (portalId: string) => {
    setPortals(prev => prev.filter(portal => portal.id !== portalId));
  };

  return (
    <div className="flex flex-col min-h-screen">
      <h1 className='ml-4'>Create Submission Portal</h1>
      <div className="flex flex-col gap-6 p-4">
        {user.courses?.length > 0 && (
          <PortalForm user={user} onSubmit={onSubmit} />
        )}
        <PortalList 
          portals={portals} 
          loading={isLoading} 
          user={user}
          onUpdate={updatePortal}
          onDelete={removePortal}
          onRefresh={fetchPortals}
        />
      </div>
    </div>
  );
};

export default PortalComponent;
