'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Card } from '@/app/_components/ui/card';
import { ScrollArea } from '@/app/_components/ui/scroll-area';
import { Button } from '@/app/_components/ui/button';
import { RefreshCw } from 'lucide-react';
import { getAnalytics } from '../action';
import { getRobustAnalytics } from '../robust-action';
import { WithdrawalRequest } from './withdrawal-request';
import { WithdrawalHistory } from './withdrawal-history';
import { MonthlyBreakdownChart } from './monthly-breakdown-chart';
import { SettlementAdmin } from './settlement-admin';
import { WithdrawalAdmin } from './withdrawal-admin';
import { BankAccountSetup } from './bank-account-setup';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/app/_components/ui/tabs';

interface AnalyticsData {
  offlineDownloads: number;
  liveClassAttendees: number;
  mediaPlays: number;
  totalPoints: number;
  accruedAmount: number;
  totalBalance?: number;
  currentMonthEstimate?: number;
  dailyPoints: { date: string; points: number }[];
  monthlyBreakdown?: any[];
  lastWithdrawalDate: string | null;
  // Admin-specific properties
  totalSubscribers?: number;
  paidSubscribers?: number;
  revenuePool?: number;
  pointValue?: number;
  activeEducators?: number;
  calculationPeriod: {
    from: Date;
    to: Date;
  };
  debug?: {
    systemType?: string;
    finalizedBalance?: number;
    currentMonthEstimate?: number;
    totalBalance?: number;
    monthlyBreakdownCount?: number;
    currentMonthDetails?: any;
    // Legacy fields for backward compatibility
    totalSchoolPoints?: number;
    totalSubscriptions?: number;
    revenuePool?: number;
    yourShare?: number;
    grossEarnings?: number;
    totalWithdrawnAmount?: number;
    lastProcessedWithdrawal?: string | null;
  };
}

const useAnalyticsData = (userRole: string) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Use admin-specific analytics for admin users
      if (userRole === 'ADMIN') {
        const { getAdminAnalytics } = await import('../admin-action');
        const response = await getAdminAnalytics();
        setData(response as any);
        setError(null);
      } else {
        // Try the new robust system first, fallback to old system for lecturers
        try {
          const response = await getRobustAnalytics();
          setData(response);
          setError(null);
        } catch (robustError) {
          console.log('Robust analytics not ready, using fallback:', robustError);
          const response = await getAnalytics();
          setData(response as any);
          setError(null);
        }
      }
    } catch (err) {
      setError('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  }, [userRole]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

const StatCard = ({
  title,
  value,
}: {
  title: string;
  value: number | string;
}) => (
  <Card className="p-3 sm:p-4 w-full shadow-sm">
    <p className="text-xs sm:text-sm text-muted-foreground truncate">{title}</p>
    <h3 className="text-lg sm:text-xl font-semibold mt-1 truncate">{value}</h3>
  </Card>
);

const PointsChart = ({
  data,
}: {
  data: { date: string; points: number }[];
}) => {
  const chartData = data.map((item) => ({
    date: format(new Date(item.date), 'dd/MM'),
    points: item.points,
  }));

  return (
    <Card className="p-3 sm:p-4 mt-6 w-full overflow-hidden">
      <h3 className="text-base sm:text-lg font-semibold mb-3">Daily Points</h3>

      {/* Responsive container */}
      <div className="w-full h-[200px] sm:h-[250px] overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} width={40} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="points"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

interface AnalyticsClientProps {
  userRole: string;
}

export default function AnalyticsClient({ userRole }: AnalyticsClientProps) {
  const { data, loading, error, refetch } = useAnalyticsData(userRole);

  if (loading) return <p className="text-center mt-8">Loading...</p>;
  if (error) return <p className="text-center mt-8 text-red-500">{error}</p>;
  if (!data) return null;

  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
      <ScrollArea className="flex-1 p-3 sm:p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
          <h1 className="text-xl sm:text-2xl font-bold">
            {userRole === 'ADMIN' ? '🔧 Analytics Dashboard (Admin)' : '📊 Analytics Dashboard'}
          </h1>
          <Button variant="ghost" onClick={refetch} size="icon" className="self-end sm:self-auto">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* System Status Info */}
        {data.debug?.systemType === 'MONTHLY_SETTLEMENT' ? (
          <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-800">
              <strong>🎉 New System Active:</strong> Monthly Settlement System
            </p>
            <p className="text-sm text-green-700 mt-1">
              <strong>Finalized Balance:</strong> ₦{data.debug.finalizedBalance?.toFixed(2) || '0.00'} • 
              <strong> Current Month Estimate:</strong> ₦{data.debug.currentMonthEstimate?.toFixed(2) || '0.00'}
            </p>
          </div>
        ) : data.debug?.lastProcessedWithdrawal && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Legacy System:</strong> From last processed withdrawal on{' '}
              {format(new Date(data.debug.lastProcessedWithdrawal), 'MMM dd, yyyy')} to now
            </p>
            {data.debug.totalWithdrawnAmount && data.debug.totalWithdrawnAmount > 0 && (
              <p className="text-sm text-blue-700 mt-1">
                <strong>Total Withdrawn:</strong> ₦{data.debug.totalWithdrawnAmount.toFixed(2)} • 
                <strong> Gross Earnings:</strong> ₦{data.debug.grossEarnings?.toFixed(2) || '0.00'}
              </p>
            )}
          </div>
        )}

        {/* Zero Balance Warning - Only for Lecturers */}
        {userRole !== 'ADMIN' && data.accruedAmount === 0 && data.debug?.currentMonthDetails?.totalSubscribers === 0 && (
          <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ No Revenue Pool:</strong> There are currently no active subscribers, so the revenue pool is ₦0.
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              You have <strong>{data.totalPoints} points</strong>, but earnings depend on subscription revenue.
            </p>
          </div>
        )}

        {/* Admin System Overview */}
        {userRole === 'ADMIN' && (
          <div className="mb-6 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-3">🔧 System Overview</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              <div className="p-3 bg-white rounded shadow-sm">
                <div className="font-medium text-gray-600 text-xs sm:text-sm">Total Subscribers</div>
                <div className="text-lg sm:text-xl font-bold">{data.totalSubscribers || 0}</div>
              </div>
              <div className="p-3 bg-white rounded shadow-sm">
                <div className="font-medium text-gray-600 text-xs sm:text-sm">Total to Distribute</div>
                <div className="text-lg sm:text-xl font-bold">₦{data.revenuePool?.toFixed(2) || '0.00'}</div>
              </div>
              <div className="p-3 bg-white rounded shadow-sm sm:col-span-2 lg:col-span-1">
                <div className="font-medium text-gray-600 text-xs sm:text-sm">Total Points</div>
                <div className="text-lg sm:text-xl font-bold">{data.totalPoints || 0}</div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards - Show for all users */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
          <StatCard title="Offline Downloads" value={data.offlineDownloads} />
          <StatCard
            title="Live Class Attendees"
            value={data.liveClassAttendees}
          />
          <StatCard title="Media Plays" value={data.mediaPlays} />
          <StatCard title="Total Points" value={data.totalPoints} />
          {userRole !== 'ADMIN' && (
            <StatCard
              title="Accrued Amount"
              value={`₦${data.accruedAmount.toFixed(2)}`}
            />
          )}
          {userRole === 'ADMIN' && (
            <StatCard
              title="System Status"
              value="Administrator View"
            />
          )}
        </div>

        {/* Daily Points Chart - Hidden on mobile for lecturers */}
        {userRole !== "ADMIN" && (
          <div className="hidden sm:block">
            <PointsChart data={data.dailyPoints} />
          </div>
        )}
        
        {/* Monthly Breakdown Chart - New System - Hidden on mobile for lecturers */}
        {data.debug?.systemType === 'MONTHLY_SETTLEMENT' && data.monthlyBreakdown && (
          <div className="hidden sm:block">
            <MonthlyBreakdownChart 
              monthlyData={data.monthlyBreakdown}
              currentMonthEstimate={data.currentMonthEstimate || 0}
            />
          </div>
        )}
        
        {/* Withdrawal Section - Only for Lecturers */}
        {userRole !== 'ADMIN' && (
          <>
            <BankAccountSetup />
            
            <WithdrawalRequest 
              accruedAmount={data.accruedAmount}
              onRequestSubmitted={refetch}
            />
            
            <WithdrawalHistory />
          </>
        )}
        
        {/* Admin Panel - Only for Admins */}
        {userRole === 'ADMIN' && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">🔧 Admin Dashboard</h3>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="overview">📊 Overview</TabsTrigger>
                <TabsTrigger value="settlements">🔧 Settlements</TabsTrigger>
                <TabsTrigger value="withdrawals">💰 Withdrawals</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <StatCard title="Total Subscribers" value={data.totalSubscribers || 0} />
                  <StatCard title="Revenue Pool" value={`₦${data.revenuePool?.toFixed(2) || '0.00'}`} />
                  <StatCard title="Active Educators" value={data.activeEducators || 0} />
                  <StatCard title="System Status" value="Operational" />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <h4 className="text-lg font-semibold mb-4">📊 System Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Total Points Generated:</span>
                        <span className="font-semibold">{data.totalPoints || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Point Value:</span>
                        <span className="font-semibold">₦{data.pointValue?.toFixed(4) || '0.0000'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Platform Revenue (30%):</span>
                        <span className="font-semibold">₦{((data.revenuePool || 0) * 0.3 / 0.7).toFixed(2)}</span>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="p-6">
                    <h4 className="text-lg font-semibold mb-4">🎯 Quick Actions</h4>
                    <div className="space-y-3">
                      <Button 
                        className="w-full justify-start" 
                        variant="outline"
                        onClick={() => {
                          const tabsTrigger = document.querySelector('[value="settlements"]') as HTMLElement;
                          tabsTrigger?.click();
                        }}
                      >
                        🔧 Manage Settlements
                      </Button>
                      <Button 
                        className="w-full justify-start" 
                        variant="outline"
                        onClick={() => {
                          const tabsTrigger = document.querySelector('[value="withdrawals"]') as HTMLElement;
                          tabsTrigger?.click();
                        }}
                      >
                        💰 Review Withdrawals
                      </Button>
                      <Button 
                        className="w-full justify-start" 
                        variant="outline"
                        onClick={refetch}
                      >
                        🔄 Refresh Data
                      </Button>
                    </div>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="settlements" className="mt-6">
                <SettlementAdmin />
              </TabsContent>
              
              <TabsContent value="withdrawals" className="mt-6">
                <WithdrawalAdmin />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}