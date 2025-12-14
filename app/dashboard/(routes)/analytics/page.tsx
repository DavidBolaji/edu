import React from 'react';
import { getDetails } from '../../_services/user.services';
import AnalyticsClient from './_components/analytics-client';
export const revalidate = 0;

export default async function AnalyticsPage() {
  try {
    const user = await getDetails();
    
    return (
      <div>
        <AnalyticsClient userRole={user.role} />
      </div>
    );
  } catch (error) {
    console.error('Analytics page error:', error);
    
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Analytics</h1>
          <p className="text-gray-600 mb-4">
            We encountered an issue loading your analytics. Please try again later.
          </p>
          <p className="text-sm text-gray-500">
            Error: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }
}
