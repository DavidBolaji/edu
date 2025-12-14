import db from '@/prisma';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { SubscriptionRevenueService } from './subscription-revenue.service';
import { PointsCalculationService } from './points-calculation.service';

const SUBSCRIPTION_FEE = 1000;
const EDUCATOR_REVENUE_SHARE = 0.7; // 70% to educators

export class MonthlySettlementService {
  private revenueService = new SubscriptionRevenueService();
  private pointsService = new PointsCalculationService();
  
  /**
   * Calculate and finalize settlement for a specific month
   */
  async calculateMonthlySettlement(month: Date): Promise<{
    id: string;
    month: Date;
    totalSubscribers: number;
    totalRevenue: number;
    totalPoints: number;
    pointValue: number;
    educatorCount: number;
  }> {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    
    console.log(`🔧 Calculating settlement for ${monthStart.toISOString().slice(0, 7)}`);
    
    // Check if settlement already exists
    const existingSettlement = await db.monthlySettlement.findUnique({
      where: { month: monthStart }
    });
    
    if (existingSettlement?.status === 'FINALIZED') {
      console.log('✅ Settlement already finalized for this month');
      // Return existing settlement data
      const educatorCount = await db.educatorMonthlyEarning.count({
        where: { settlementId: existingSettlement.id }
      });
      return {
        id: existingSettlement.id,
        month: existingSettlement.month,
        totalSubscribers: existingSettlement.totalSubscribers,
        totalRevenue: existingSettlement.totalRevenue,
        totalPoints: existingSettlement.totalPoints,
        pointValue: existingSettlement.pointValue,
        educatorCount
      };
    }
    
    try {
      // Use corrected revenue and points calculation
      const [revenueData, pointsData] = await Promise.all([
        this.revenueService.calculateMonthlyRevenue(monthStart),
        this.pointsService.calculateTotalPointsForMonth(monthStart)
      ]);
      
      const distributableRevenue = this.revenueService.calculateDistributableRevenue(revenueData.totalRevenue);
      const pointValue = pointsData.totalPoints > 0 ? distributableRevenue / pointsData.totalPoints : 0;
    
    console.log(`📊 Month: ${monthStart.toISOString().slice(0, 7)}`);
    console.log(`👥 Subscribers: ${revenueData.subscriberCount}`);
    console.log(`💰 Total Revenue: ₦${revenueData.totalRevenue.toFixed(2)}`);
    console.log(`💸 Distributable Revenue (70%): ₦${distributableRevenue.toFixed(2)}`);
    console.log(`🎯 Total Points: ${pointsData.totalPoints}`);
    console.log(`💎 Point Value: ₦${pointValue.toFixed(4)}`);
    
    // Create or update settlement
    const settlement = await db.monthlySettlement.upsert({
      where: { month: monthStart },
      create: {
        month: monthStart,
        totalSubscribers: revenueData.subscriberCount,
        totalRevenue: distributableRevenue, // Store distributable revenue
        totalPoints: pointsData.totalPoints,
        pointValue,
        status: 'CALCULATING'
      },
      update: {
        totalSubscribers: revenueData.subscriberCount,
        totalRevenue: distributableRevenue,
        totalPoints: pointsData.totalPoints,
        pointValue,
        status: 'CALCULATING'
      }
    });
    
    // Get active educators for the month
    const activeEducators = await this.pointsService.getActiveEducatorsForMonth(monthStart);
    
    // Calculate each educator's earnings
    let educatorCount = 0;
    for (const educatorId of activeEducators) {
      const educatorPointsData = await this.pointsService.calculateEducatorPointsForMonth(educatorId, monthStart);
      const earnings = Math.round(educatorPointsData.totalPoints * pointValue * 100) / 100;
      
      // Only create earnings record if educator has points
      if (educatorPointsData.totalPoints > 0) {
        await db.educatorMonthlyEarning.upsert({
          where: {
            userId_settlementId: {
              userId: educatorId,
              settlementId: settlement.id
            }
          },
          create: {
            userId: educatorId,
            settlementId: settlement.id,
            points: educatorPointsData.totalPoints,
            earnings,
            availableBalance: earnings
          },
          update: {
            points: educatorPointsData.totalPoints,
            earnings,
            availableBalance: earnings // Reset available balance on recalculation
          }
        });
        
        educatorCount++;
        console.log(`👨‍🏫 Educator ${educatorId}: ${educatorPointsData.totalPoints} points = ₦${earnings.toFixed(2)}`);
      }
    }
    
    // Finalize settlement
    const finalizedSettlement = await db.monthlySettlement.update({
      where: { id: settlement.id },
      data: {
        status: 'FINALIZED',
        finalizedAt: new Date()
      }
    });
    
    console.log(`✅ Settlement finalized for ${monthStart.toISOString().slice(0, 7)}`);
    
      // Return settlement data
      return {
        id: finalizedSettlement.id,
        month: finalizedSettlement.month,
        totalSubscribers: finalizedSettlement.totalSubscribers,
        totalRevenue: finalizedSettlement.totalRevenue,
        totalPoints: finalizedSettlement.totalPoints,
        pointValue: finalizedSettlement.pointValue,
        educatorCount
      };
    } catch (error) {
      console.error('Error in calculateMonthlySettlement:', error);
      throw new Error(`Settlement calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Get educator's balance breakdown
   */
  async getEducatorBalance(userId: string) {
    try {
      // Get all finalized monthly earnings
      const monthlyEarnings = await db.educatorMonthlyEarning.findMany({
        where: { userId },
        include: {
          settlement: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Filter for finalized settlements
      const finalizedEarnings = monthlyEarnings.filter(
        earning => earning.settlement?.status === 'FINALIZED'
      );
    
    // Calculate finalized balance
    const finalizedBalance = finalizedEarnings
      .reduce((sum, earning) => sum + earning.availableBalance, 0);
    
    // Get current month estimate
    const currentMonth = startOfMonth(new Date());
    const currentMonthEstimate = await this.getCurrentMonthEstimate(userId);
    
      return {
        finalizedBalance,
        currentMonthEstimate: currentMonthEstimate.earnings,
        totalBalance: finalizedBalance + currentMonthEstimate.earnings,
        monthlyBreakdown: monthlyEarnings.map(earning => ({
          month: earning.settlement?.month || new Date(),
          points: earning.points,
          earnings: earning.earnings,
          withdrawn: earning.withdrawn,
          availableBalance: earning.availableBalance,
          pointValue: earning.settlement?.pointValue || 0,
          status: earning.settlement?.status || 'CALCULATING'
        })),
        currentMonthDetails: currentMonthEstimate
      };
    } catch (error) {
      // If tables don't exist yet, return fallback data
      console.log('Monthly settlement tables not ready, returning fallback');
      const currentMonthEstimate = await this.getCurrentMonthEstimate(userId);
      
      return {
        finalizedBalance: 0,
        currentMonthEstimate: currentMonthEstimate.earnings,
        totalBalance: currentMonthEstimate.earnings,
        monthlyBreakdown: [],
        currentMonthDetails: currentMonthEstimate
      };
    }
  }
  
  /**
   * Process withdrawal from finalized balances
   */
  async processWithdrawal(userId: string, amount: number): Promise<boolean> {
    const balance = await this.getEducatorBalance(userId);
    
    if (amount > balance.finalizedBalance) {
      throw new Error('Cannot withdraw more than finalized balance');
    }
    
    // Deduct from oldest available balances first (FIFO)
    let remainingAmount = amount;
    const earnings = await db.educatorMonthlyEarning.findMany({
      where: {
        userId,
        availableBalance: { gt: 0 },
        settlement: { status: 'FINALIZED' }
      },
      include: { settlement: true },
      orderBy: {
        settlement: { month: 'asc' }
      }
    });
    
    for (const earning of earnings) {
      if (remainingAmount <= 0) break;
      
      const deductAmount = Math.min(remainingAmount, earning.availableBalance);
      
      await db.educatorMonthlyEarning.update({
        where: { id: earning.id },
        data: {
          withdrawn: earning.withdrawn + deductAmount,
          availableBalance: earning.availableBalance - deductAmount
        }
      });
      
      remainingAmount -= deductAmount;
    }
    
    return remainingAmount === 0;
  }
  

  
  private async getCurrentMonthEstimate(userId: string) {
    try {
      const currentMonth = startOfMonth(new Date());
      
      // Use corrected services for current month estimate
      const [revenueData, pointsData, educatorPointsData] = await Promise.all([
        this.revenueService.calculateMonthlyRevenue(currentMonth),
        this.pointsService.calculateTotalPointsForMonth(currentMonth),
        this.pointsService.calculateEducatorPointsForMonth(userId, currentMonth)
      ]);
      
      const distributableRevenue = this.revenueService.calculateDistributableRevenue(revenueData.totalRevenue);
      const estimatedPointValue = pointsData.totalPoints > 0 ? distributableRevenue / pointsData.totalPoints : 0;
      const estimatedEarnings = Math.round(educatorPointsData.totalPoints * estimatedPointValue * 100) / 100;
      
      return {
        points: educatorPointsData.totalPoints,
        earnings: estimatedEarnings,
        pointValue: estimatedPointValue,
        totalPoints: pointsData.totalPoints,
        totalSubscribers: revenueData.subscriberCount,
        note: revenueData.subscriberCount === 0 
          ? 'No paid subscribers - earnings will be ₦0' 
          : 'Estimate - will be finalized at month end'
      };
    } catch (error) {
      console.log('Error getting current month estimate, using fallback');
      return {
        points: 0,
        earnings: 0,
        pointValue: 0,
        totalPoints: 0,
        totalSubscribers: 0,
        note: 'Unable to calculate estimate - system may need setup'
      };
    }
  }
}