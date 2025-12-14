'use client';

import React from 'react';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Card } from '@/app/_components/ui/card';
import { Badge } from '@/app/_components/ui/badge';

interface MonthlyBreakdown {
  month: Date;
  points: number;
  earnings: number;
  withdrawn: number;
  availableBalance: number;
  pointValue: number;
  status: 'FINALIZED' | 'CALCULATING';
}

interface MonthlyBreakdownChartProps {
  monthlyData: MonthlyBreakdown[];
  currentMonthEstimate: number;
}

export function MonthlyBreakdownChart({ 
  monthlyData, 
  currentMonthEstimate 
}: MonthlyBreakdownChartProps) {
  
  // Prepare chart data
  const chartData = [
    ...monthlyData.map((item) => ({
      month: format(new Date(item.month), 'MMM yyyy'),
      earnings: item.earnings,
      withdrawn: item.withdrawn,
      available: item.availableBalance,
      status: item.status,
      pointValue: item.pointValue,
      points: item.points
    })),
    // Add current month estimate
    {
      month: format(new Date(), 'MMM yyyy'),
      earnings: currentMonthEstimate,
      withdrawn: 0,
      available: currentMonthEstimate,
      status: 'ESTIMATING' as const,
      pointValue: 0,
      points: 0
    }
  ].reverse(); // Show most recent first

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          <div className="space-y-1 text-sm">
            <p className="text-blue-600">
              Earnings: ₦{data.earnings.toFixed(2)}
            </p>
            <p className="text-red-600">
              Withdrawn: ₦{data.withdrawn.toFixed(2)}
            </p>
            <p className="text-green-600">
              Available: ₦{data.available.toFixed(2)}
            </p>
            {data.status !== 'ESTIMATING' && (
              <>
                <p className="text-gray-600">
                  Points: {data.points}
                </p>
                <p className="text-gray-600">
                  Point Value: ₦{data.pointValue.toFixed(4)}
                </p>
              </>
            )}
            <Badge 
              className={
                data.status === 'FINALIZED' 
                  ? 'bg-green-100 text-green-800' 
                  : data.status === 'CALCULATING'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-blue-100 text-blue-800'
              }
            >
              {data.status === 'ESTIMATING' ? 'Current Month' : data.status}
            </Badge>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-3 sm:p-6 mt-6 w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <h3 className="text-base sm:text-lg font-semibold">Monthly Earnings Breakdown</h3>
        <div className="flex flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Earnings</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Withdrawn</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Available</span>
          </div>
        </div>
      </div>

      <div className="w-full h-[250px] sm:h-[300px] overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={60}
              interval={0}
            />
            <YAxis 
              tick={{ fontSize: 10 }}
              tickFormatter={(value) => `₦${value}`}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="earnings" 
              fill="#3b82f6" 
              name="Total Earnings"
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              dataKey="withdrawn" 
              fill="#ef4444" 
              name="Withdrawn"
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              dataKey="available" 
              fill="#22c55e" 
              name="Available"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Summary Table */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Month</th>
              <th className="text-right p-2">Points</th>
              <th className="text-right p-2">Point Value</th>
              <th className="text-right p-2">Earnings</th>
              <th className="text-right p-2">Available</th>
              <th className="text-center p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {chartData.reverse().map((item, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="p-2 font-medium">{item.month}</td>
                <td className="p-2 text-right">{item.points || '-'}</td>
                <td className="p-2 text-right">
                  {item.pointValue > 0 ? `₦${item.pointValue.toFixed(4)}` : '-'}
                </td>
                <td className="p-2 text-right">₦{item.earnings.toFixed(2)}</td>
                <td className="p-2 text-right">₦{item.available.toFixed(2)}</td>
                <td className="p-2 text-center">
                  <Badge 
                    className={
                      item.status === 'FINALIZED' 
                        ? 'bg-green-100 text-green-800' 
                        : item.status === 'CALCULATING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }
                  >
                    {item.status === 'ESTIMATING' ? 'Current' : item.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}