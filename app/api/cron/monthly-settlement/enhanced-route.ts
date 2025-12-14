import { NextRequest, NextResponse } from 'next/server';
import { MonthlySettlementService } from '@/src/application/services/monthly-settlement.service';
import { subMonths, startOfMonth, format } from 'date-fns';
import db from '@/prisma';
import crypto from 'crypto';

/**
 * Enhanced Monthly Settlement Cron Job with Better Security
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Enhanced Authentication
    const authResult = await validateCronAuthentication(request);
    if (!authResult.valid) {
      // Log security attempt (without exposing secret)
      console.warn('Unauthorized cron attempt:', {
        ip: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent'),
        timestamp: new Date().toISOString(),
        reason: authResult.reason
      });
      
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // 2. Rate limiting (prevent abuse)
    const rateLimitResult = await checkRateLimit(request);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' }, 
        { status: 429 }
      );
    }

    console.log('🚀 Starting authenticated monthly settlement cron job...');
    
    const settlementService = new MonthlySettlementService();
    const now = new Date();
    const previousMonth = startOfMonth(subMonths(now, 1));
    
    console.log(`📊 Processing settlement for ${format(previousMonth, 'MMMM yyyy')}`);
    
    await settlementService.calculateMonthlySettlement(previousMonth);
    
    // Get settlement summary (same as before)
    const settlement = await db.monthlySettlement.findUnique({
      where: { month: previousMonth },
      include: {
        educatorEarnings: {
          include: {
            user: {
              select: {
                fname: true,
                lname: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!settlement) {
      throw new Error('Settlement not found after processing');
    }

    const summary = {
      month: format(previousMonth, 'MMMM yyyy'),
      totalRevenue: settlement.totalRevenue,
      totalPoints: settlement.totalPoints,
      pointValue: settlement.pointValue,
      educatorsCount: settlement.educatorEarnings.length,
      totalEarnings: settlement.educatorEarnings.reduce(
        (sum, earning) => sum + earning.earnings, 0
      ),
      status: settlement.status
    };

    const educatorDetails = settlement.educatorEarnings.map(earning => ({
      educatorId: earning.userId,
      name: `${earning.user.fname} ${earning.user.lname}`,
      email: earning.user.email,
      points: earning.points,
      earnings: earning.earnings,
      availableBalance: earning.availableBalance,
      withdrawn: earning.withdrawn
    }));

    console.log('✅ Monthly settlement completed:', summary);

    // Log successful execution (for audit trail)
    console.log('Settlement audit:', {
      executedAt: new Date().toISOString(),
      month: summary.month,
      educatorsProcessed: summary.educatorsCount,
      totalRevenue: summary.totalRevenue,
      authenticatedBy: 'cron-service'
    });

    return NextResponse.json({
      success: true,
      message: `Monthly settlement completed for ${summary.month}`,
      summary,
      educatorDetails,
      settlementBreakdown: {
        totalEducators: educatorDetails.length,
        totalPointsAwarded: settlement.totalPoints,
        averageEarnings: educatorDetails.length > 0 
          ? educatorDetails.reduce((sum, e) => sum + e.earnings, 0) / educatorDetails.length 
          : 0,
        topEarner: educatorDetails.length > 0 
          ? educatorDetails.reduce((max, e) => e.earnings > max.earnings ? e : max)
          : null
      }
    });

  } catch (error) {
    console.error('❌ Monthly settlement cron job failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Monthly settlement failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

/**
 * Enhanced authentication with multiple security layers
 */
async function validateCronAuthentication(request: NextRequest): Promise<{
  valid: boolean;
  reason?: string;
}> {
  // 1. Check if CRON_SECRET is configured
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return { valid: false, reason: 'CRON_SECRET not configured' };
  }

  // 2. Check Authorization header exists
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return { valid: false, reason: 'Missing Authorization header' };
  }

  // 3. Check Bearer format
  if (!authHeader.startsWith('Bearer ')) {
    return { valid: false, reason: 'Invalid Authorization format' };
  }

  // 4. Extract and validate secret
  const providedSecret = authHeader.substring(7); // Remove "Bearer "
  
  // 5. Constant-time comparison (prevents timing attacks)
  const expectedSecret = cronSecret;
  if (providedSecret.length !== expectedSecret.length) {
    return { valid: false, reason: 'Invalid secret length' };
  }

  // Use crypto.timingSafeEqual for constant-time comparison
  const providedBuffer = Buffer.from(providedSecret, 'utf8');
  const expectedBuffer = Buffer.from(expectedSecret, 'utf8');
  
  if (!crypto.timingSafeEqual(providedBuffer, expectedBuffer)) {
    return { valid: false, reason: 'Invalid secret' };
  }

  // 6. Additional security checks
  const userAgent = request.headers.get('user-agent');
  
  // Optional: Verify it's coming from Vercel (if using Vercel cron)
  if (process.env.NODE_ENV === 'production') {
    // Vercel cron jobs have specific user agent patterns
    if (userAgent && !userAgent.includes('vercel')) {
      console.warn('Cron request from non-Vercel source:', userAgent);
      // You might want to allow this or not, depending on your setup
    }
  }

  return { valid: true };
}

/**
 * Simple rate limiting to prevent abuse
 */
async function checkRateLimit(request: NextRequest): Promise<{
  allowed: boolean;
}> {
  // Simple in-memory rate limiting (you might want to use Redis in production)
  const ip = request.ip || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 5; // Max 5 requests per minute

  // In production, you'd use Redis or a database for this
  // For now, this is just a basic implementation
  
  return { allowed: true }; // Simplified for example
}

/**
 * GET endpoint for testing authentication
 */
export async function GET(request: NextRequest) {
  const authResult = await validateCronAuthentication(request);
  
  if (!authResult.valid) {
    return NextResponse.json(
      { error: 'Unauthorized', reason: authResult.reason }, 
      { status: 401 }
    );
  }

  return NextResponse.json({
    message: 'Cron authentication successful',
    timestamp: new Date().toISOString(),
    nextScheduledRun: '1st of next month at 00:00 UTC'
  });
}