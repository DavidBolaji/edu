'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/app/_components/ui/card';
import { Badge } from '@/app/_components/ui/badge';
import { ScrollArea } from '@/app/_components/ui/scroll-area';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { getUserWithdrawalRequests } from '../actions/withdrawal.action';

interface WithdrawalRequest {
  id: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED';
  requestedAt: string | Date;
  processedAt?: string | Date | null;
}

export function WithdrawalHistory() {
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const result = await getUserWithdrawalRequests();
        if (result.success && result.data) {
          setRequests(result.data as WithdrawalRequest[]);
        }
      } catch (error) {
        console.error('Error fetching withdrawal requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'APPROVED':
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      case 'PROCESSED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'APPROVED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PROCESSED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card className="p-6 mt-6">
        <h3 className="text-lg font-semibold mb-4">Withdrawal History</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-3 sm:p-6 mt-6 w-full overflow-hidden">
      <h3 className="text-base sm:text-lg font-semibold mb-4">Withdrawal History</h3>
      
      {requests.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No withdrawal requests yet</p>
          <p className="text-sm mt-1">Submit your first withdrawal request above</p>
        </div>
      ) : (
        <ScrollArea className="h-64">
          <div className="space-y-3">
            {requests.map((request) => (
              <div
                key={request.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {getStatusIcon(request.status)}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">₦{request.amount.toFixed(2)}</p>
                    <p className="text-sm text-gray-600 truncate">
                      Requested {format(new Date(request.requestedAt), 'MMM dd, yyyy')}
                    </p>
                    {request.processedAt && (
                      <p className="text-xs text-gray-500 truncate">
                        Processed {format(new Date(request.processedAt), 'MMM dd, yyyy')}
                      </p>
                    )}
                  </div>
                </div>
                
                <Badge className={`${getStatusColor(request.status)} flex-shrink-0`}>
                  {request.status.toLowerCase()}
                </Badge>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </Card>
  );
}