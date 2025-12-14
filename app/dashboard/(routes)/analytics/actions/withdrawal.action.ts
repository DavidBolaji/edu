'use server';

import db from '@/prisma';
import { getDetails } from '../../../_services/user.services';

export async function createWithdrawalRequest(amount: number) {
  try {
    const user = await getDetails();
    
    // Check if user has pending withdrawal request
    const pendingRequest = await db.withdrawalRequest.findFirst({
      where: {
        userId: user.id,
        status: 'PENDING'
      }
    });

    if (pendingRequest) {
      return {
        success: false,
        error: 'You already have a pending withdrawal request'
      };
    }

    // Create withdrawal request
    const withdrawalRequest = await db.withdrawalRequest.create({
      data: {
        userId: user.id,
        amount,
        status: 'PENDING'
      }
    });

    return {
      success: true,
      data: withdrawalRequest
    };
  } catch (error) {
    console.error('Error creating withdrawal request:', error);
    return {
      success: false,
      error: 'Failed to create withdrawal request'
    };
  }
}

export async function getUserWithdrawalRequests() {
  try {
    const user = await getDetails();
    
    const requests = await db.withdrawalRequest.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10 // Last 10 requests
    });

    return {
      success: true,
      data: requests
    };
  } catch (error) {
    console.error('Error fetching withdrawal requests:', error);
    return {
      success: false,
      error: 'Failed to fetch withdrawal requests'
    };
  }
}