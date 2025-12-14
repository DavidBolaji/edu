'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { Badge } from '@/app/_components/ui/badge';
import { ScrollArea } from '@/app/_components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/_components/ui/dialog';
import { Calendar, ChevronDown, TrendingUp, Users, Target, DollarSign, Award } from 'lucide-react';
import { format, subMonths, startOfMonth } from 'date-fns';

interface SettlementData {
  settlement: {
    month: string;
    totalRevenue: number;
    totalPoints: number;
    pointValue: number;
    totalSubscribers: number;
    status: string;
  };
  educators: Array<{
    name: string;
    email: string;
    school: string;
    statistics: {
      points: number;
      earnings: number;
      availableBalance: number;
      withdrawn: number;
    };
  }>;
  analytics: {
    totalEducators: number;
    totalEarnings: number;
    totalWithdrawn: number;
    totalAvailable: number;
    averageEarnings: number;
    topEarner: any;
  };
}

export function SettlementAdmin() {
  const [settlements, setSettlements] = useState<SettlementData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Generate available months (current month and 6 months back)
  const availableMonths = Array.from({ length: 7 }, (_, i) => {
    const now = new Date();
    const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1); // Use local date arithmetic
    const value = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-01`;
    const label = format(targetDate, 'MMMM yyyy');
    
    console.log(`Month ${i}: ${label} -> ${value}`);
    
    return {
      value,
      label,
      isCurrent: i === 0,
      isPrevious: i === 1
    };
  });

  useEffect(() => {
    fetchSettlements();
  }, []);

  const fetchSettlements = async () => {
    try {
      console.log('📊 Fetching settlement details...');
      const response = await fetch('/api/admin/settlement-details');
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Fetch settlements error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Settlement data received:', data);
      setSettlements(data.settlements || []);
    } catch (error) {
      console.error('Error fetching settlements:', error);
      // Show user-friendly error message
      alert(`Failed to load settlement data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const previewSettlement = async (targetMonth: string) => {
    try {
      setPreviewLoading(true);
      console.log(`🔍 Previewing settlement for month: ${targetMonth}`);
      
      const response = await fetch('/api/admin/settlement-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: targetMonth })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const preview = await response.json();
      setPreviewData(preview);
      setShowPreviewModal(true);
    } catch (error) {
      alert(`Failed to preview settlement: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setPreviewLoading(false);
    }
  };

  const triggerSettlement = async (targetMonth?: string) => {
    try {
      setLoading(true);
      console.log('🔧 Triggering manual settlement...');
      
      const response = await fetch('/api/admin/trigger-settlement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          month: targetMonth || new Date().toISOString().slice(0, 10) // Consistent YYYY-MM-DD format
        })
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Settlement result:', result);
      
      if (result.success) {
        await fetchSettlements();
        alert(`✅ Settlement completed successfully!\n\nMonth: ${result.settlement.month}\nRevenue: ₦${result.settlement.totalRevenue.toFixed(2)}\nEducators: ${result.settlement.educatorsCount}\nPoint Value: ₦${result.settlement.pointValue.toFixed(4)}`);
      } else {
        alert(`❌ Settlement failed: ${result.error}\n\nDetails: ${result.details || 'No additional details'}`);
      }
    } catch (error) {
      console.error('Settlement trigger error:', error);
      alert(`❌ Failed to trigger settlement\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

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
      {/* Admin Controls */}
      <Card className="p-6">
        <div className="flex flex-col gap-4 mb-4">
          <h3 className="text-base sm:text-lg font-semibold">Settlement Administration</h3>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 sm:flex-none">
              <Button
                variant="outline"
                onClick={() => setShowMonthSelector(!showMonthSelector)}
                className="w-full sm:w-auto flex items-center gap-2 justify-between sm:justify-center"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span className="truncate">
                    {selectedMonth 
                      ? availableMonths.find(m => m.value === selectedMonth)?.label 
                      : 'Select Month'
                    }
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 flex-shrink-0" />
              </Button>
              
              {showMonthSelector && (
                <div className="absolute top-full mt-1 left-0 right-0 sm:right-auto sm:min-w-48 bg-white border rounded-md shadow-lg z-10">
                  {availableMonths.map((month) => (
                    <button
                      key={month.value}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center justify-between"
                      onClick={() => {
                        setSelectedMonth(month.value);
                        setShowMonthSelector(false);
                      }}
                    >
                      <span className="truncate">{month.label}</span>
                      {month.isCurrent && (
                        <Badge className="bg-blue-100 text-blue-800 text-xs ml-2 flex-shrink-0">Current</Badge>
                      )}
                      {month.isPrevious && (
                        <Badge className="bg-gray-100 text-gray-800 text-xs ml-2 flex-shrink-0">Previous</Badge>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <Button 
              onClick={() => previewSettlement(selectedMonth!)} 
              disabled={!selectedMonth || previewLoading}
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
            >
              {previewLoading ? 'Loading...' : '👁️ Preview'}
            </Button>
            
            <Button 
              onClick={() => triggerSettlement(selectedMonth || undefined)} 
              disabled={loading || !selectedMonth}
              variant="default"
              size="sm"
              className="w-full sm:w-auto"
            >
              {loading ? 'Processing...' : 'Trigger Settlement'}
            </Button>
          </div>
        </div>
        
        {/* Quick Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <Button 
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedMonth(availableMonths[0].value);
              previewSettlement(availableMonths[0].value);
            }}
            disabled={loading || previewLoading}
            className="w-full sm:w-auto text-xs sm:text-sm whitespace-nowrap"
          >
            <span className="hidden sm:inline">🚀 Preview Current Month ({availableMonths[0].label})</span>
            <span className="sm:hidden">🚀 Current ({availableMonths[0].label})</span>
          </Button>
          <Button 
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedMonth(availableMonths[1].value);
              previewSettlement(availableMonths[1].value);
            }}
            disabled={loading || previewLoading}
            className="w-full sm:w-auto text-xs sm:text-sm whitespace-nowrap"
          >
            <span className="hidden sm:inline">📅 Preview Previous Month ({availableMonths[1].label})</span>
            <span className="sm:hidden">📅 Previous ({availableMonths[1].label})</span>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Total Settlements</p>
            <p className="text-xl font-semibold">{settlements.length}</p>
          </div>
          <div>
            <p className="text-gray-600">Latest Month</p>
            <p className="text-xl font-semibold">
              {settlements.length > 0 ? settlements[0].settlement.month : 'None'}
            </p>
          </div>
          <div>
            <p className="text-gray-600">System Status</p>
            <Badge className="bg-green-100 text-green-800">Operational</Badge>
          </div>
        </div>
        
        {/* Help Information */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Settlement Guide</h4>
          <div className="text-xs text-blue-800 space-y-1">
            <p>• <strong>Current Month:</strong> Process ongoing activities (use for testing)</p>
            <p>• <strong>Previous Month:</strong> Standard monthly settlement (recommended)</p>
            <p>• <strong>Preview:</strong> See calculation details before processing</p>
            <p>• <strong>Points:</strong> Downloads (3pts), Live Classes (5pts), Plays (0.2pts)</p>
            <p>• <strong>Revenue:</strong> 70% of subscription fees distributed to educators</p>
          </div>
        </div>
      </Card>

      {/* Settlements List */}
      {settlements.map((settlement, index) => (
        <Card key={index} className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold">{settlement.settlement.month}</h4>
            <Badge className="bg-blue-100 text-blue-800">
              {settlement.settlement.status}
            </Badge>
          </div>

          {/* Settlement Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
            <div>
              <p className="text-gray-600">Total to Distribute</p>
              <p className="font-semibold">₦{settlement.settlement.totalRevenue.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-600">Total Points</p>
              <p className="font-semibold">{settlement.settlement.totalPoints}</p>
            </div>
            <div>
              <p className="text-gray-600">Point Value</p>
              <p className="font-semibold">₦{settlement.settlement.pointValue.toFixed(4)}</p>
            </div>
            <div>
              <p className="text-gray-600">Subscribers</p>
              <p className="font-semibold">{settlement.settlement.totalSubscribers}</p>
            </div>
          </div>

          {/* Analytics Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm bg-gray-50 p-4 rounded">
            <div>
              <p className="text-gray-600">Educators</p>
              <p className="font-semibold">{settlement.analytics.totalEducators}</p>
            </div>
            <div>
              <p className="text-gray-600">Total Earnings</p>
              <p className="font-semibold">₦{settlement.analytics.totalEarnings.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-600">Total Withdrawn</p>
              <p className="font-semibold">₦{settlement.analytics.totalWithdrawn.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-600">Available</p>
              <p className="font-semibold">₦{settlement.analytics.totalAvailable.toFixed(2)}</p>
            </div>
          </div>

          {/* Top Educators */}
          <div>
            <h5 className="font-medium mb-3">Educator Breakdown</h5>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {settlement.educators.map((educator, eduIndex) => (
                  <div key={eduIndex} className="flex items-center justify-between p-3 bg-white rounded border">
                    <div>
                      <p className="font-medium">{educator.name}</p>
                      <p className="text-sm text-gray-600">{educator.email}</p>
                      <p className="text-xs text-gray-500">{educator.school}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-medium">₦{educator.statistics.earnings.toFixed(2)}</p>
                      <p className="text-gray-600">{educator.statistics.points} points</p>
                      <p className="text-xs text-gray-500">
                        Available: ₦{educator.statistics.availableBalance.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </Card>
      ))}

      {settlements.length === 0 && (
        <Card className="p-6 text-center">
          <p className="text-gray-600">No settlements found. Trigger a manual settlement to get started.</p>
        </Card>
      )}

      {/* Settlement Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Settlement Preview - {previewData?.month}
            </DialogTitle>
          </DialogHeader>

          {previewData && (
            <div className="space-y-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">Revenue Pool</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    ₦{previewData.totalRevenue.toFixed(2)}
                  </p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">Subscribers</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {previewData.totalSubscribers}
                  </p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium">Total Points</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">
                    {previewData.totalPoints}
                  </p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium">Point Value</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-600">
                    ₦{previewData.pointValue.toFixed(4)}
                  </p>
                </Card>
              </div>

              {/* Points Breakdown */}
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">📈 Points Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                    <div>
                      <p className="font-medium">📥 Downloads</p>
                      <p className="text-sm text-gray-600">{previewData.pointsBreakdown.downloads.count} × 3 points</p>
                    </div>
                    <p className="text-xl font-bold text-blue-600">
                      {previewData.pointsBreakdown.downloads.points}
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                    <div>
                      <p className="font-medium">🎥 Live Classes</p>
                      <p className="text-sm text-gray-600">{previewData.pointsBreakdown.liveClasses.count} × 5 points</p>
                    </div>
                    <p className="text-xl font-bold text-green-600">
                      {previewData.pointsBreakdown.liveClasses.points}
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded">
                    <div>
                      <p className="font-medium">▶️ Media Plays</p>
                      <p className="text-sm text-gray-600">{previewData.pointsBreakdown.plays.count} × 0.2 points</p>
                    </div>
                    <p className="text-xl font-bold text-purple-600">
                      {previewData.pointsBreakdown.plays.points}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Distribution Summary */}
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">💰 Distribution Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600">Active Educators</p>
                    <p className="text-2xl font-bold">{previewData.activeEducators}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Average Earnings</p>
                    <p className="text-2xl font-bold">₦{previewData.summary.averageEarnings.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total to Distribute</p>
                    <p className="text-2xl font-bold text-green-600">₦{previewData.summary.totalEarningsToDistribute.toFixed(2)}</p>
                  </div>
                </div>
              </Card>

              {/* Top Educators Preview */}
              {previewData.educatorPreviews && previewData.educatorPreviews.length > 0 && (
                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-4">🏆 Top Educators Preview</h3>
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {previewData.educatorPreviews.slice(0, 10).map((educator: any, index: number) => (
                        <div key={educator.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-indigo-600">#{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium">{educator.name}</p>
                              <p className="text-sm text-gray-600">{educator.school}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">₦{educator.earnings.toFixed(2)}</p>
                            <p className="text-sm text-gray-600">{educator.points} points ({educator.percentage.toFixed(1)}%)</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </Card>
              )}

              {/* Warning if no data */}
              {previewData.totalPoints === 0 && (
                <Card className="p-4 bg-yellow-50 border-yellow-200">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <span className="text-lg">⚠️</span>
                    <div>
                      <p className="font-medium">No Activity Found</p>
                      <p className="text-sm">No qualifying activities found for this month. Settlement will have zero earnings.</p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowPreviewModal(false)}>
              Close Preview
            </Button>
            <Button 
              onClick={() => {
                setShowPreviewModal(false);
                triggerSettlement(selectedMonth || undefined);
              }}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              ✅ Proceed with Settlement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}