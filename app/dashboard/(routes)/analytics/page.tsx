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
import { getAnalytics } from './action';

interface AnalyticsData {
  offlineDownloads: number;
  liveClassAttendees: number;
  mediaPlays: number;
  totalPoints: number;
  accruedAmount: number;
  dailyPoints: { date: string; points: number }[];
}

const useAnalyticsData = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAnalytics();
      setData(response);
      setError(null);
    } catch (err) {
      setError('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  }, []);

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
  <Card className="p-4 w-full shadow-sm">
    <p className="text-sm text-muted-foreground">{title}</p>
    <h3 className="text-xl font-semibold mt-1">{value}</h3>
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
    <Card className="p-4 mt-6 w-full">
      <h3 className="text-lg font-semibold mb-3">Daily Points</h3>

      {/* Responsive container */}
      <div className="w-full h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="points"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

const LecturerAnalytics = () => {
  const { data, loading, error, refetch } = useAnalyticsData();

  if (loading) return <p className="text-center mt-8">Loading...</p>;
  if (error) return <p className="text-center mt-8 text-red-500">{error}</p>;
  if (!data) return null;

  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
      <ScrollArea className="flex-1 p-4 md:p-6">
        <div className="flex justify-end mb-4">
          <Button variant="ghost" onClick={refetch} size="icon">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard title="Offline Downloads" value={data.offlineDownloads} />
          <StatCard
            title="Live Class Attendees"
            value={data.liveClassAttendees}
          />
          <StatCard title="Media Plays" value={data.mediaPlays} />
          <StatCard title="Total Points" value={data.totalPoints} />
          <StatCard
            title="Accrued Amount"
            value={`₦${data.accruedAmount.toFixed(2)}`}
          />
        </div>

        <PointsChart data={data.dailyPoints} />
      </ScrollArea>
    </div>
  );
};

export default LecturerAnalytics;
