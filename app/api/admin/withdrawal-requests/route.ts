import { NextRequest, NextResponse } from 'next/server';
import db from '@/prisma';
import { getDetails } from '@/app/dashboard/_services/user.services';
import { MonthlySettlementService } from '@/src/application/services/monthly-settlement.service';

/**
 * Get all withdrawal requests (Admin Only)
 */
export async function GET() {
  try {
    const user = await getDetails();
    
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const withdrawalRequests = await db.withdrawalRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            fname: true,
            lname: true,
            email: true,
            school: true,
            bankName: true,
            accountNumber: true,
            accountName: true,
            bankCode: true
          }
        }
      },
      orderBy: {
        requestedAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: withdrawalRequests
    });

  } catch (error) {
    console.error('Error fetching withdrawal requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch withdrawal requests' },
      { status: 500 }
    );
  }
}

/**
 * Update withdrawal request status (Admin Only)
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getDetails();
    
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { requestId, status, reason } = body;

    if (!requestId || !status) {
      return NextResponse.json({ error: 'Request ID and status are required' }, { status: 400 });
    }

    if (!['APPROVED', 'REJECTED', 'PROCESSED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Update the withdrawal request
    const updatedRequest = await db.withdrawalRequest.update({
      where: { id: requestId },
      data: {
        status: status as any,
        processedAt: new Date(),
        // You could add a reason field to the schema if needed
      },
      include: {
        user: {
          select: {
            fname: true,
            lname: true,
            email: true
          }
        }
      }
    });

    // If approved and processed, deduct from educator's available balance
    if (status === 'PROCESSED') {
      try {
        const settlementService = new MonthlySettlementService();
        const success = await settlementService.processWithdrawal(updatedRequest.userId, updatedRequest.amount);
        
        if (!success) {
          console.error(`Failed to process withdrawal: Insufficient balance for user ${updatedRequest.userId}`);
          // Revert the status update if withdrawal processing failed
          await db.withdrawalRequest.update({
            where: { id: requestId },
            data: { status: 'APPROVED' }
          });
          
          return NextResponse.json(
            { error: 'Insufficient available balance to process withdrawal' },
            { status: 400 }
          );
        }
        
        console.log(`✅ Successfully processed withdrawal of ₦${updatedRequest.amount} for ${updatedRequest.user.email}`);
      } catch (error) {
        console.error(`Error processing withdrawal for user ${updatedRequest.userId}:`, error);
        
        // Revert the status update if withdrawal processing failed
        await db.withdrawalRequest.update({
          where: { id: requestId },
          data: { status: 'APPROVED' }
        });
        
        return NextResponse.json(
          { error: 'Failed to process withdrawal from balance' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Withdrawal request ${status.toLowerCase()} successfully`,
      data: updatedRequest
    });

  } catch (error) {
    console.error('Error updating withdrawal request:', error);
    return NextResponse.json(
      { error: 'Failed to update withdrawal request' },
      { status: 500 }
    );
  }
}