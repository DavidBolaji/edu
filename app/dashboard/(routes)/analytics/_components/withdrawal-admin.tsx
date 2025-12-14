'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { Badge } from '@/app/_components/ui/badge';
import { ScrollArea } from '@/app/_components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/_components/ui/dialog';
import { 
  Wallet, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  User,
  Calendar,
  DollarSign,
  Eye,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  CreditCard,
  Building2,
  Hash,
  UserCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';

interface WithdrawalRequest {
  id: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED';
  requestedAt: string;
  processedAt?: string;
  user: {
    id: string;
    fname: string;
    lname: string;
    email: string;
    school: string;
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    bankCode?: string;
  };
}

export function WithdrawalAdmin() {
  const [allRequests, setAllRequests] = useState<WithdrawalRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'APPROVED' | 'REJECTED' | 'PROCESSED' | null>(null);
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  
  // Filtering and pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchWithdrawalRequests();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [allRequests, searchTerm, statusFilter, sortBy, sortOrder]);

  const fetchWithdrawalRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/withdrawal-requests');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setAllRequests(data.data || []);
    } catch (error) {
      console.error('Error fetching withdrawal requests:', error);
      alert('Failed to load withdrawal requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (request: WithdrawalRequest, action: 'APPROVED' | 'REJECTED' | 'PROCESSED') => {
    setSelectedRequest(request);
    setActionType(action);
    setReason('');
    setShowActionModal(true);
  };

  const confirmAction = async () => {
    if (!selectedRequest || !actionType) return;

    try {
      setProcessing(true);
      const response = await fetch('/api/admin/withdrawal-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          status: actionType,
          reason: reason.trim() || undefined
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        await fetchWithdrawalRequests();
        setShowActionModal(false);
        alert(`✅ Withdrawal request ${actionType.toLowerCase()} successfully!`);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error updating withdrawal request:', error);
      alert(`❌ Failed to ${actionType.toLowerCase()} withdrawal request`);
    } finally {
      setProcessing(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allRequests];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(request => 
        `${request.user.fname} ${request.user.lname}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.user.school?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.amount.toString().includes(searchTerm)
      );
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'name':
          comparison = `${a.user.fname} ${a.user.lname}`.localeCompare(`${b.user.fname} ${b.user.lname}`);
          break;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    setFilteredRequests(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const toggleCardExpansion = (requestId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(requestId)) {
      newExpanded.delete(requestId);
    } else {
      newExpanded.add(requestId);
    }
    setExpandedCards(newExpanded);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'APPROVED':
        return <Badge className="bg-blue-100 text-blue-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'PROCESSED':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Processed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getActionButtons = (request: WithdrawalRequest) => {
    switch (request.status) {
      case 'PENDING':
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAction(request, 'APPROVED')}
              className="text-green-600 border-green-200 hover:bg-green-50"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAction(request, 'REJECTED')}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4 mr-1" />
              Reject
            </Button>
          </div>
        );
      case 'APPROVED':
        return (
          <Button
            size="sm"
            onClick={() => handleAction(request, 'PROCESSED')}
            className="bg-green-600 hover:bg-green-700"
          >
            <Wallet className="w-4 h-4 mr-1" />
            Mark as Processed
          </Button>
        );
      default:
        return null;
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRequests = filteredRequests.slice(startIndex, endIndex);

  // Statistics based on all requests (not filtered)
  const pendingRequests = allRequests.filter(r => r.status === 'PENDING');
  const approvedRequests = allRequests.filter(r => r.status === 'APPROVED');
  const processedRequests = allRequests.filter(r => r.status === 'PROCESSED');
  const rejectedRequests = allRequests.filter(r => r.status === 'REJECTED');

  const totalPendingAmount = pendingRequests.reduce((sum, r) => sum + r.amount, 0);
  const totalApprovedAmount = approvedRequests.reduce((sum, r) => sum + r.amount, 0);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-yellow-600" />
            <span className="text-xs sm:text-sm font-medium truncate">Pending</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-yellow-600">{pendingRequests.length}</p>
          <p className="text-xs sm:text-sm text-gray-600 truncate">₦{totalPendingAmount.toFixed(2)}</p>
        </Card>

        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            <span className="text-xs sm:text-sm font-medium truncate">Approved</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-blue-600">{approvedRequests.length}</p>
          <p className="text-xs sm:text-sm text-gray-600 truncate">₦{totalApprovedAmount.toFixed(2)}</p>
        </Card>

        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-green-600" />
            <span className="text-xs sm:text-sm font-medium truncate">Processed</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-green-600">{processedRequests.length}</p>
        </Card>

        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-red-600" />
            <span className="text-xs sm:text-sm font-medium truncate">Rejected</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-red-600">{rejectedRequests.length}</p>
        </Card>
      </div>

      {/* Search and Filter Controls */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, school, or amount..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="PROCESSED">Processed</option>
              <option value="REJECTED">Rejected</option>
            </select>
            
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field as 'date' | 'amount' | 'name');
                setSortOrder(order as 'asc' | 'desc');
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="date-desc">Latest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
            </select>
          </div>
        </div>
        
        <div className="mt-3 text-sm text-gray-600">
          Showing {currentRequests.length} of {filteredRequests.length} requests
          {searchTerm && ` matching "${searchTerm}"`}
          {statusFilter !== 'ALL' && ` with status "${statusFilter}"`}
        </div>
      </Card>

      {/* Withdrawal Requests List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Withdrawal Requests
          </h3>
          <Button variant="outline" onClick={fetchWithdrawalRequests} size="sm">
            Refresh
          </Button>
        </div>

        {currentRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {filteredRequests.length === 0 ? 'No withdrawal requests found' : 'No requests match your filters'}
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {currentRequests.map((request: WithdrawalRequest) => {
                const isExpanded = expandedCards.has(request.id);
                const hasBankAccount = request.user.bankName && request.user.accountNumber;
                
                return (
                  <div key={request.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    {/* Main Card Content */}
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-medium">{request.user.fname} {request.user.lname}</p>
                          <p className="text-sm text-gray-600">{request.user.email}</p>
                          <p className="text-xs text-gray-500">{request.user.school}</p>
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="text-lg font-bold">₦{request.amount.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(request.requestedAt), 'MMM dd, yyyy')}
                        </div>
                      </div>

                      <div className="text-center">
                        {getStatusBadge(request.status)}
                        {request.processedAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            Processed: {format(new Date(request.processedAt), 'MMM dd')}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleCardExpansion(request.id)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                        {getActionButtons(request)}
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-gray-50 p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Bank Account Information */}
                          <div className="space-y-3">
                            <h4 className="font-medium text-gray-900 flex items-center gap-2">
                              <CreditCard className="w-4 h-4" />
                              Bank Account Details
                            </h4>
                            {hasBankAccount ? (
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                  <Building2 className="w-3 h-3 text-gray-400" />
                                  <span className="font-medium">Bank:</span>
                                  <span>{request.user.bankName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Hash className="w-3 h-3 text-gray-400" />
                                  <span className="font-medium">Account:</span>
                                  <span className="font-mono">{request.user.accountNumber}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <UserCheck className="w-3 h-3 text-gray-400" />
                                  <span className="font-medium">Name:</span>
                                  <span>{request.user.accountName}</span>
                                </div>
                                {request.user.bankCode && (
                                  <div className="flex items-center gap-2">
                                    <Hash className="w-3 h-3 text-gray-400" />
                                    <span className="font-medium">Bank Code:</span>
                                    <span className="font-mono">{request.user.bankCode}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-red-600 text-sm">
                                <AlertTriangle className="w-4 h-4" />
                                <span>No bank account configured</span>
                              </div>
                            )}
                          </div>

                          {/* Request Details */}
                          <div className="space-y-3">
                            <h4 className="font-medium text-gray-900 flex items-center gap-2">
                              <Eye className="w-4 h-4" />
                              Request Details
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="font-medium">Request ID:</span>
                                <span className="ml-2 font-mono text-xs">{request.id}</span>
                              </div>
                              <div>
                                <span className="font-medium">Requested:</span>
                                <span className="ml-2">{format(new Date(request.requestedAt), 'PPpp')}</span>
                              </div>
                              {request.processedAt && (
                                <div>
                                  <span className="font-medium">Processed:</span>
                                  <span className="ml-2">{format(new Date(request.processedAt), 'PPpp')}</span>
                                </div>
                              )}
                              <div>
                                <span className="font-medium">Amount:</span>
                                <span className="ml-2 text-green-600 font-bold">₦{request.amount.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Warning for missing bank account */}
                        {!hasBankAccount && (request.status === 'APPROVED' || request.status === 'PENDING') && (
                          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center gap-2 text-yellow-800">
                              <AlertTriangle className="w-4 h-4" />
                              <span className="text-sm font-medium">Action Required</span>
                            </div>
                            <p className="text-sm text-yellow-700 mt-1">
                              This educator has not configured their bank account details. 
                              Payment cannot be processed until bank information is provided.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages} ({filteredRequests.length} total requests)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Action Confirmation Modal */}
      <Dialog open={showActionModal} onOpenChange={setShowActionModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === 'APPROVED' && <CheckCircle className="w-5 h-5 text-green-600" />}
              {actionType === 'REJECTED' && <XCircle className="w-5 h-5 text-red-600" />}
              {actionType === 'PROCESSED' && <Wallet className="w-5 h-5 text-blue-600" />}
              {actionType === 'APPROVED' && 'Approve Withdrawal Request'}
              {actionType === 'REJECTED' && 'Reject Withdrawal Request'}
              {actionType === 'PROCESSED' && 'Mark as Processed'}
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium">{selectedRequest.user.fname} {selectedRequest.user.lname}</p>
                <p className="text-sm text-gray-600">{selectedRequest.user.email}</p>
                <p className="text-lg font-bold text-green-600 mt-2">₦{selectedRequest.amount.toFixed(2)}</p>
              </div>

              {actionType === 'REJECTED' && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Reason for rejection (optional):
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>
              )}

              {actionType === 'PROCESSED' && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">Important</span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    Only mark as processed after you have successfully transferred the funds to the educator&apos;s account.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowActionModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmAction}
              disabled={processing}
              className={
                actionType === 'APPROVED' ? 'bg-green-600 hover:bg-green-700' :
                actionType === 'REJECTED' ? 'bg-red-600 hover:bg-red-700' :
                'bg-blue-600 hover:bg-blue-700'
              }
            >
              {processing ? 'Processing...' : `Confirm ${actionType?.toLowerCase()}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}