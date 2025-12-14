import { NextRequest, NextResponse } from 'next/server';
import { getDetails } from '@/app/dashboard/_services/user.services';
import db from '@/prisma';

/**
 * Get user's bank account details
 */
export async function GET() {
  try {
    const user = await getDetails();
    
    const userWithBankAccount = await db.user.findUnique({
      where: { id: user.id },
      select: {
        bankName: true,
        accountNumber: true,
        accountName: true,
        bankCode: true
      }
    });

    if (!userWithBankAccount?.bankName) {
      return NextResponse.json({
        success: true,
        bankAccount: null,
        message: 'No bank account configured'
      });
    }

    return NextResponse.json({
      success: true,
      bankAccount: {
        bankName: userWithBankAccount.bankName,
        accountNumber: userWithBankAccount.accountNumber,
        accountName: userWithBankAccount.accountName,
        bankCode: userWithBankAccount.bankCode
      }
    });

  } catch (error) {
    console.error('Error fetching bank account:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch bank account details' 
      },
      { status: 500 }
    );
  }
}

/**
 * Save/Update user's bank account details
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getDetails();
    const body = await request.json();
    
    const { bankName, accountNumber, accountName, bankCode } = body;

    // Validation
    if (!bankName || !accountNumber || !accountName) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Bank name, account number, and account name are required' 
        },
        { status: 400 }
      );
    }

    if (!/^\d{10}$/.test(accountNumber)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Account number must be exactly 10 digits' 
        },
        { status: 400 }
      );
    }

    // Update user's bank account details
    await db.user.update({
      where: { id: user.id },
      data: {
        bankName,
        accountNumber,
        accountName: accountName.toUpperCase(),
        bankCode
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Bank account details saved successfully'
    });

  } catch (error) {
    console.error('Error saving bank account:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to save bank account details' 
      },
      { status: 500 }
    );
  }
}

/**
 * Verify bank account details (optional - for future integration with bank APIs)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountNumber, bankCode } = body;

    // TODO: Integrate with Nigerian bank verification API
    // For now, just return success
    // In production, you would call Paystack, Flutterwave, or similar service
    // to verify the account number and get the account name

    return NextResponse.json({
      success: true,
      accountName: 'ACCOUNT NAME FROM BANK', // This would come from bank API
      message: 'Account verified successfully'
    });

  } catch (error) {
    console.error('Error verifying bank account:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to verify bank account' 
      },
      { status: 500 }
    );
  }
}