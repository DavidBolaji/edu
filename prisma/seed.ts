import { PrismaClient, SubscriptionStatus, PlanType, PaymentStatus } from '@prisma/client';
import { hash } from 'bcrypt-ts';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting revamped subscription seed...');

  // Clear existing data
  console.log('🧹 Cleaning existing data...');
  
  try {
    await prisma.withdrawalRequest.deleteMany();
    await prisma.educatorMonthlyEarning.deleteMany();
    await prisma.monthlySettlement.deleteMany();
    await prisma.subscriptionHistory.deleteMany();
    await prisma.subscriptionUsage.deleteMany();
    await prisma.subscriptionPayment.deleteMany();
    await prisma.play.deleteMany();
    await prisma.offlineDownload.deleteMany();
    await prisma.mediaView.deleteMany();
    await prisma.like.deleteMany();
    await prisma.liveClassAttendee.deleteMany();
    await prisma.liveClass.deleteMany();
    await prisma.subscriptionPlan.deleteMany();
    await prisma.quizSubmission.deleteMany();
    await prisma.submission.deleteMany();
    await prisma.question.deleteMany();
    await prisma.quiz.deleteMany();
    await prisma.portal.deleteMany();
    await prisma.media.deleteMany();
    await prisma.level.deleteMany();
    await prisma.course.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.session.deleteMany();
    await prisma.webPush.deleteMany();
    await prisma.wallet.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.user.deleteMany();
    console.log('✅ Existing data cleared');
  } catch (error) {
    console.log('⚠️  Some tables may not exist yet, continuing with seed...');
  }

  const hashedPassword = await hash('password123', 10);

  // Create test users
  console.log('👥 Creating test users...');
  
  // Admin user
  const admin = await prisma.user.create({
    data: {
      fname: 'Admin',
      lname: 'User',
      middlename: 'Test',
      email: 'admin@edu-pwa.com',
      password: hashedPassword,
      phone: '+2348000000001',
      school: 'System Administration',
      role: 'ADMIN',
      title: 'Mr',
      bankName: 'Access Bank',
      accountNumber: '0123456789',
      accountName: 'ADMIN USER TEST',
      bankCode: '044'
    }
  });

  // Educators
  const educator1 = await prisma.user.create({
    data: {
      fname: 'John',
      lname: 'Doe',
      middlename: 'Teacher',
      email: 'john.doe@edu-pwa.com',
      password: hashedPassword,
      phone: '+2348000000002',
      school: 'University of Lagos',
      role: 'LECTURER',
      title: 'Dr',
      bankName: 'Guaranty Trust Bank',
      accountNumber: '0123456790',
      accountName: 'JOHN DOE TEACHER',
      bankCode: '058'
    }
  });

  const educator2 = await prisma.user.create({
    data: {
      fname: 'Jane',
      lname: 'Smith',
      middlename: 'Professor',
      email: 'jane.smith@edu-pwa.com',
      password: hashedPassword,
      phone: '+2348000000003',
      school: 'Obafemi Awolowo University',
      role: 'LECTURER',
      title: 'Professor',
      bankName: 'United Bank for Africa',
      accountNumber: '0123456791',
      accountName: 'JANE SMITH PROFESSOR',
      bankCode: '033'
    }
  });

  const educator3 = await prisma.user.create({
    data: {
      fname: 'Mike',
      lname: 'Johnson',
      middlename: 'New',
      email: 'mike.johnson@edu-pwa.com',
      password: hashedPassword,
      phone: '+2348000000004',
      school: 'University of Ibadan',
      role: 'LECTURER',
      title: 'Mr'
    }
  });

  // Create 25 students for comprehensive testing
  const students = [];
  for (let i = 1; i <= 25; i++) {
    const student = await prisma.user.create({
      data: {
        fname: `Student${i}`,
        lname: `Test`,
        middlename: 'User',
        email: `student${i}@edu-pwa.com`,
        password: hashedPassword,
        phone: `+23480000001${i.toString().padStart(2, '0')}`,
        school: 'Test School',
        role: 'STUDENT'
      }
    });
    students.push(student);
  }

  console.log('📚 Creating courses and content...');

  // Create courses
  const course1 = await prisma.course.create({
    data: {
      title: 'Advanced Mathematics',
      userId: educator1.id
    }
  });

  const course2 = await prisma.course.create({
    data: {
      title: 'Computer Science Fundamentals',
      userId: educator2.id
    }
  });

  const course3 = await prisma.course.create({
    data: {
      title: 'Physics for Beginners',
      userId: educator3.id
    }
  });

  // Create levels
  const level1 = await prisma.level.create({
    data: {
      name: 'Level 1',
      courseId: course1.id
    }
  });

  const level2 = await prisma.level.create({
    data: {
      name: 'Level 1',
      courseId: course2.id
    }
  });

  const level3 = await prisma.level.create({
    data: {
      name: 'Level 1',
      courseId: course3.id
    }
  });

  // Create media content
  const media1 = await prisma.media.create({
    data: {
      name: 'Calculus Basics Video',
      size: 1024000,
      format: 'mp4',
      url: 'https://example.com/calculus-video.mp4',
      type: 'VIDEO',
      courseId: course1.id,
      levelId: level1.id,
      userId: educator1.id
    }
  });

  const media2 = await prisma.media.create({
    data: {
      name: 'Programming Tutorial Audio',
      size: 512000,
      format: 'mp3',
      url: 'https://example.com/programming-audio.mp3',
      type: 'AUDIO',
      courseId: course2.id,
      levelId: level2.id,
      userId: educator2.id
    }
  });

  const media3 = await prisma.media.create({
    data: {
      name: 'Physics Textbook PDF',
      size: 2048000,
      format: 'pdf',
      url: 'https://example.com/physics-book.pdf',
      type: 'EBOOK',
      courseId: course3.id,
      levelId: level3.id,
      userId: educator3.id
    }
  });

  console.log('💰 Creating wallets...');

  // Create wallets for all users
  await prisma.wallet.create({
    data: { userId: admin.id, amount: 100000 }
  });

  await prisma.wallet.create({
    data: { userId: educator1.id, amount: 50000 }
  });

  await prisma.wallet.create({
    data: { userId: educator2.id, amount: 30000 }
  });

  await prisma.wallet.create({
    data: { userId: educator3.id, amount: 10000 }
  });

  // Create wallets for students with sufficient balance for testing
  for (let i = 0; i < students.length; i++) {
    await prisma.wallet.create({
      data: { 
        userId: students[i].id, 
        amount: 5000 + Math.random() * 10000 // 5k-15k range
      }
    });
  }

  console.log('📋 Creating revamped subscription plans...');

  // November 2025 test data (for settlement testing)
  const novemberStart = new Date(2025, 10, 1); // November 1, 2025
  const novemberEnd = new Date(2025, 10, 30, 23, 59, 59); // November 30, 2025

  // December 2025 (current month for testing)
  const decemberStart = new Date(2025, 11, 1); // December 1, 2025

  // Create different subscription scenarios for comprehensive testing
  const subscriptionScenarios = [
    // Scenario 1: Full month Premium subscribers (started before November)
    { count: 8, type: 'full-month-premium', startDate: new Date(2025, 9, 15) }, // Started Oct 15
    
    // Scenario 2: Mid-month Premium subscribers (started during November)
    { count: 5, type: 'mid-month-premium', startDate: new Date(2025, 10, 15) }, // Started Nov 15
    
    // Scenario 3: Yearly Premium subscribers
    { count: 3, type: 'yearly-premium', startDate: new Date(2025, 9, 1) }, // Started Oct 1
    
    // Scenario 4: Free users (no revenue)
    { count: 4, type: 'free', startDate: new Date(2025, 10, 1) },
    
    // Scenario 5: Multi-month subscribers (3 months starting mid-November)
    { count: 3, type: 'multi-month-premium', startDate: new Date(2025, 10, 20) }, // Started Nov 20
    
    // Scenario 6: Expired subscriptions (for testing status updates)
    { count: 2, type: 'expired-premium', startDate: new Date(2025, 9, 1) }, // Expired in November
    
    // Scenario 7: Subscriptions expiring today (for cron testing)
    { count: 3, type: 'expiring-today', startDate: new Date(2025, 10, 13) }, // Expires today (Dec 13)
    
    // Scenario 8: Grace period subscriptions (expired but in grace period)
    { count: 2, type: 'grace-period', startDate: new Date(2025, 10, 1) } // Expired Dec 1, now in grace
  ];

  let studentIndex = 0;
  let totalActiveSubscribers = 0;
  let totalRevenue = 0;

  for (const scenario of subscriptionScenarios) {
    console.log(`Creating ${scenario.count} ${scenario.type} subscriptions...`);
    
    for (let i = 0; i < scenario.count && studentIndex < students.length; i++) {
      const student = students[studentIndex];
      studentIndex++;

      let subscriptionData: any;
      let paymentData: any = null;
      let isActive = true;

      switch (scenario.type) {
        case 'full-month-premium':
          // Premium subscription active throughout November
          subscriptionData = {
            userId: student.id,
            name: 'Premium',
            price: 1000,
            expiresAt: new Date(2025, 11, 15), // Expires Dec 15
            status: SubscriptionStatus.ACTIVE,
            isYearly: false,
            monthsPaid: 1,
            planType: PlanType.MONTHLY,
            maxDownloads: null,
            maxLiveClasses: null,
            autoRenew: true,
            createdAt: scenario.startDate,
            lastRenewalDate: scenario.startDate,
            nextBillingDate: new Date(2025, 11, 15)
          };
          
          paymentData = {
            userId: student.id,
            amount: 1000,
            monthlyAmount: 1000,
            months: 1,
            isYearly: false,
            planType: PlanType.MONTHLY,
            paymentMethod: 'wallet',
            paymentStatus: PaymentStatus.COMPLETED,
            paymentDate: scenario.startDate,
            subscriptionStartDate: scenario.startDate,
            subscriptionEndDate: new Date(2025, 11, 15),
            expirationAfter: new Date(2025, 11, 15),
            // No revenue allocation needed (full month)
            currentMonthRevenue: null,
            nextMonthRevenue: null,
            revenueRatio: null
          };
          
          totalActiveSubscribers++;
          totalRevenue += 1000;
          break;

        case 'mid-month-premium':
          // Premium subscription starting mid-November (revenue allocation test)
          const midNovStart = scenario.startDate;
          const midNovEnd = new Date(2025, 11, 15); // Expires Dec 15
          
          // Calculate revenue allocation for mid-month subscription
          const daysInNovember = 30;
          const daysRemainingInNovember = daysInNovember - midNovStart.getDate() + 1; // 16 days (15th to 30th)
          const revenueRatio = daysRemainingInNovember / daysInNovember; // 16/30 = 0.533
          const novemberRevenue = 1000 * revenueRatio; // ₦533
          const decemberRevenue = 1000 * (1 - revenueRatio); // ₦467
          
          subscriptionData = {
            userId: student.id,
            name: 'Premium',
            price: 1000,
            expiresAt: midNovEnd,
            status: SubscriptionStatus.ACTIVE,
            isYearly: false,
            monthsPaid: 1,
            planType: PlanType.MONTHLY,
            maxDownloads: null,
            maxLiveClasses: null,
            autoRenew: true,
            createdAt: midNovStart,
            lastRenewalDate: midNovStart,
            nextBillingDate: midNovEnd
          };
          
          paymentData = {
            userId: student.id,
            amount: 1000,
            monthlyAmount: 1000,
            months: 1,
            isYearly: false,
            planType: PlanType.MONTHLY,
            paymentMethod: 'wallet',
            paymentStatus: PaymentStatus.COMPLETED,
            paymentDate: midNovStart,
            subscriptionStartDate: midNovStart,
            subscriptionEndDate: midNovEnd,
            expirationAfter: midNovEnd,
            // Revenue allocation for mid-month subscription
            currentMonthRevenue: novemberRevenue,
            nextMonthRevenue: decemberRevenue,
            revenueRatio: revenueRatio
          };
          
          totalActiveSubscribers++;
          totalRevenue += novemberRevenue; // Only November portion
          break;

        case 'yearly-premium':
          // Yearly Premium subscription
          subscriptionData = {
            userId: student.id,
            name: 'Premium',
            price: 1000, // Monthly rate
            expiresAt: new Date(2026, 9, 1), // Expires Oct 1, 2026
            status: SubscriptionStatus.ACTIVE,
            isYearly: true,
            monthsPaid: 12,
            planType: PlanType.YEARLY,
            maxDownloads: null,
            maxLiveClasses: null,
            autoRenew: true,
            createdAt: scenario.startDate,
            lastRenewalDate: scenario.startDate,
            nextBillingDate: new Date(2026, 9, 1)
          };
          
          paymentData = {
            userId: student.id,
            amount: 12000,
            monthlyAmount: 1000,
            months: 12,
            isYearly: true,
            planType: PlanType.YEARLY,
            paymentMethod: 'wallet',
            paymentStatus: PaymentStatus.COMPLETED,
            paymentDate: scenario.startDate,
            subscriptionStartDate: scenario.startDate,
            subscriptionEndDate: new Date(2026, 9, 1),
            expirationAfter: new Date(2026, 9, 1),
            // No revenue allocation needed (yearly billing)
            currentMonthRevenue: null,
            nextMonthRevenue: null,
            revenueRatio: null
          };
          
          totalActiveSubscribers++;
          totalRevenue += 1000; // Monthly rate for November
          break;

        case 'multi-month-premium':
          // 3-month Premium subscription starting late November
          const multiStart = scenario.startDate; // Nov 20
          const multiEnd = new Date(2026, 1, 20); // Feb 20, 2026
          
          // Calculate revenue allocation for late November start
          const daysInNov = 30;
          const daysRemainingInNov = daysInNov - multiStart.getDate() + 1; // 11 days (20th to 30th)
          const multiRatio = daysRemainingInNov / daysInNov; // 11/30 = 0.367
          const multiNovRevenue = 1000 * multiRatio; // ₦367
          const multiDecRevenue = 1000 * (1 - multiRatio); // ₦633
          
          subscriptionData = {
            userId: student.id,
            name: 'Premium',
            price: 1000,
            expiresAt: multiEnd,
            status: SubscriptionStatus.ACTIVE,
            isYearly: false,
            monthsPaid: 3,
            planType: PlanType.MONTHLY,
            maxDownloads: null,
            maxLiveClasses: null,
            autoRenew: true,
            createdAt: multiStart,
            lastRenewalDate: multiStart,
            nextBillingDate: multiEnd
          };
          
          paymentData = {
            userId: student.id,
            amount: 3000,
            monthlyAmount: 1000,
            months: 3,
            isYearly: false,
            planType: PlanType.MONTHLY,
            paymentMethod: 'wallet',
            paymentStatus: PaymentStatus.COMPLETED,
            paymentDate: multiStart,
            subscriptionStartDate: multiStart,
            subscriptionEndDate: multiEnd,
            expirationAfter: multiEnd,
            // Revenue allocation for late November start
            currentMonthRevenue: multiNovRevenue,
            nextMonthRevenue: multiDecRevenue,
            revenueRatio: multiRatio
          };
          
          totalActiveSubscribers++;
          totalRevenue += multiNovRevenue; // Only November portion
          break;

        case 'free':
          // Free subscription
          subscriptionData = {
            userId: student.id,
            name: 'Free',
            price: 0,
            expiresAt: new Date(2099, 11, 31), // Far future
            status: SubscriptionStatus.ACTIVE,
            isYearly: false,
            monthsPaid: 1,
            planType: PlanType.MONTHLY,
            maxDownloads: 5,
            maxLiveClasses: 1,
            autoRenew: false,
            createdAt: scenario.startDate
          };
          // No payment for free subscriptions
          break;

        case 'expired-premium':
          // Expired Premium subscription (expired Nov 1st - correct 1 month duration)
          subscriptionData = {
            userId: student.id,
            name: 'Premium',
            price: 1000,
            expiresAt: new Date(2025, 10, 1), // Expired Nov 1 (Oct 1 + 1 month)
            status: SubscriptionStatus.EXPIRED,
            isYearly: false,
            monthsPaid: 1,
            planType: PlanType.MONTHLY,
            maxDownloads: null,
            maxLiveClasses: null,
            autoRenew: false,
            createdAt: scenario.startDate,
            lastRenewalDate: scenario.startDate
          };
          
          paymentData = {
            userId: student.id,
            amount: 1000,
            monthlyAmount: 1000,
            months: 1,
            isYearly: false,
            planType: PlanType.MONTHLY,
            paymentMethod: 'wallet',
            paymentStatus: PaymentStatus.COMPLETED,
            paymentDate: scenario.startDate,
            subscriptionStartDate: scenario.startDate,
            subscriptionEndDate: new Date(2025, 10, 1),
            expirationAfter: new Date(2025, 10, 1),
            currentMonthRevenue: null,
            nextMonthRevenue: null,
            revenueRatio: null
          };
          
          // Don't count expired subscriptions in active count or revenue
          isActive = false;
          break;

        case 'expiring-today':
          // Subscriptions expiring today (for cron job testing)
          const today = new Date(); // Current date
          subscriptionData = {
            userId: student.id,
            name: 'Premium',
            price: 1000,
            expiresAt: today, // Expires today
            status: SubscriptionStatus.ACTIVE,
            isYearly: false,
            monthsPaid: 1,
            planType: PlanType.MONTHLY,
            maxDownloads: null,
            maxLiveClasses: null,
            autoRenew: true, // Will test auto-renewal
            createdAt: scenario.startDate,
            lastRenewalDate: scenario.startDate,
            nextBillingDate: today
          };
          
          paymentData = {
            userId: student.id,
            amount: 1000,
            monthlyAmount: 1000,
            months: 1,
            isYearly: false,
            planType: PlanType.MONTHLY,
            paymentMethod: 'wallet',
            paymentStatus: PaymentStatus.COMPLETED,
            paymentDate: scenario.startDate,
            subscriptionStartDate: scenario.startDate,
            subscriptionEndDate: today,
            expirationAfter: today,
            currentMonthRevenue: null,
            nextMonthRevenue: null,
            revenueRatio: null
          };
          
          totalActiveSubscribers++;
          totalRevenue += 1000;
          break;

        case 'grace-period':
          // Subscriptions in grace period (expired but still accessible)
          const expiredDate = new Date(2025, 11, 1); // Expired Dec 1
          const gracePeriodEnd = new Date(2025, 11, 8); // Grace period ends Dec 8
          
          subscriptionData = {
            userId: student.id,
            name: 'Premium',
            price: 1000,
            expiresAt: expiredDate,
            status: SubscriptionStatus.GRACE_PERIOD,
            isYearly: false,
            monthsPaid: 1,
            planType: PlanType.MONTHLY,
            maxDownloads: null,
            maxLiveClasses: null,
            autoRenew: false, // Auto-renewal failed
            gracePeriodEnds: gracePeriodEnd,
            createdAt: scenario.startDate,
            lastRenewalDate: scenario.startDate
          };
          
          paymentData = {
            userId: student.id,
            amount: 1000,
            monthlyAmount: 1000,
            months: 1,
            isYearly: false,
            planType: PlanType.MONTHLY,
            paymentMethod: 'wallet',
            paymentStatus: PaymentStatus.COMPLETED,
            paymentDate: scenario.startDate,
            subscriptionStartDate: scenario.startDate,
            subscriptionEndDate: expiredDate,
            expirationAfter: expiredDate,
            currentMonthRevenue: null,
            nextMonthRevenue: null,
            revenueRatio: null
          };
          
          // Grace period subscriptions still count as active for now
          totalActiveSubscribers++;
          totalRevenue += 1000;
          break;
      }

      // Create subscription plan
      const subscription = await prisma.subscriptionPlan.create({
        data: subscriptionData
      });

      // Create payment record if applicable
      if (paymentData) {
        await prisma.subscriptionPayment.create({
          data: {
            ...paymentData,
            subscriptionId: subscription.id
          }
        });
      }

      // Create subscription usage for November
      if (isActive) {
        await prisma.subscriptionUsage.create({
          data: {
            userId: student.id,
            month: novemberStart,
            downloadsUsed: Math.floor(Math.random() * 10),
            liveClassesUsed: Math.floor(Math.random() * 3)
          }
        });
      }

      // Create subscription history
      await prisma.subscriptionHistory.create({
        data: {
          userId: student.id,
          action: scenario.type === 'expired-premium' ? 'EXPIRED' : 'CREATED',
          newStatus: subscriptionData.status,
          newExpiryDate: subscriptionData.expiresAt,
          reason: `${scenario.type} subscription created for testing`,
          createdAt: scenario.startDate
        }
      });
    }
  }

  console.log('🎯 Creating November 2025 activities (for settlement testing)...');

  // Generate plays for November with different activity levels per educator
  const novemberActivities = [
    { educator: educator1, media: media1, plays: 120, downloads: 40, liveClassAttendees: 25 },
    { educator: educator2, media: media2, plays: 80, downloads: 25, liveClassAttendees: 15 },
    { educator: educator3, media: media3, plays: 40, downloads: 10, liveClassAttendees: 8 }
  ];

  let totalPoints = 0;

  for (const activity of novemberActivities) {
    // Create plays
    for (let i = 0; i < activity.plays; i++) {
      const watchRatio = 0.3 + Math.random() * 0.6; // 30-90% completion
      await prisma.play.create({
        data: {
          userId: students[i % 20].id, // Use first 20 students
          mediaId: activity.media.id,
          educatorId: activity.educator.id,
          durationWatched: 300 + Math.random() * 600,
          mediaDuration: 900,
          watchRatio: watchRatio,
          sessionId: `nov_session_${Date.now()}_${i}`,
          userAgent: 'Mozilla/5.0 Test Browser',
          ipAddress: `192.168.1.${100 + (i % 50)}`,
          createdAt: new Date(novemberStart.getTime() + Math.random() * (novemberEnd.getTime() - novemberStart.getTime()))
        }
      });
      totalPoints += watchRatio;
    }

    // Create downloads
    for (let i = 0; i < activity.downloads; i++) {
      await prisma.offlineDownload.create({
        data: {
          userId: students[i % 15].id,
          mediaId: activity.media.id,
          educatorId: activity.educator.id,
          createdAt: new Date(novemberStart.getTime() + Math.random() * (novemberEnd.getTime() - novemberStart.getTime()))
        }
      });
      totalPoints += 1; // 1 point per download
    }

    // Create live class and attendees
    const liveClass = await prisma.liveClass.create({
      data: {
        userId: activity.educator.id,
        url: `https://meet.example.com/nov-class-${activity.educator.id}`,
        createdAt: new Date(novemberStart.getTime() + Math.random() * (novemberEnd.getTime() - novemberStart.getTime()))
      }
    });

    for (let i = 0; i < activity.liveClassAttendees; i++) {
      await prisma.liveClassAttendee.create({
        data: {
          liveClassId: liveClass.id,
          userId: students[i % 18].id,
          joinedAt: new Date(novemberStart.getTime() + Math.random() * (novemberEnd.getTime() - novemberStart.getTime()))
        }
      });
      totalPoints += 1; // 1 point per live class attendance
    }
  }

  console.log('📊 Creating December 2025 activities (current month)...');

  // Create December plays
  for (let i = 0; i < 30; i++) {
    const watchRatio = 0.4 + Math.random() * 0.5;
    await prisma.play.create({
      data: {
        userId: students[i % 15].id,
        mediaId: i % 2 === 0 ? media1.id : media2.id,
        educatorId: i % 2 === 0 ? educator1.id : educator2.id,
        durationWatched: 200 + Math.random() * 400,
        mediaDuration: 600,
        watchRatio: watchRatio,
        sessionId: `dec_session_${Date.now()}_${i}`,
        userAgent: 'Mozilla/5.0 Test Browser',
        ipAddress: `192.168.3.${100 + (i % 25)}`,
        createdAt: new Date(decemberStart.getTime() + Math.random() * (Date.now() - decemberStart.getTime()))
      }
    });
  }

  // Create December downloads
  for (let i = 0; i < 15; i++) {
    await prisma.offlineDownload.create({
      data: {
        userId: students[i % 10].id,
        mediaId: i % 2 === 0 ? media1.id : media2.id,
        educatorId: i % 2 === 0 ? educator1.id : educator2.id,
        createdAt: new Date(decemberStart.getTime() + Math.random() * (Date.now() - decemberStart.getTime()))
      }
    });
  }

  // Create December live class and attendees
  const decLiveClass = await prisma.liveClass.create({
    data: {
      userId: educator1.id,
      url: 'https://meet.example.com/dec-class',
      createdAt: new Date(decemberStart.getTime() + Math.random() * (Date.now() - decemberStart.getTime()))
    }
  });

  for (let i = 0; i < 8; i++) {
    await prisma.liveClassAttendee.create({
      data: {
        liveClassId: decLiveClass.id,
        userId: students[i % 8].id,
        joinedAt: new Date(decemberStart.getTime() + Math.random() * (Date.now() - decemberStart.getTime()))
      }
    });
  }

  // Calculate expected point value
  const expectedPointValue = totalRevenue > 0 && totalPoints > 0 ? totalRevenue / totalPoints : 0;

  console.log('✅ Revamped subscription seed completed successfully!');
  console.log('\n📋 Test Users Created:');
  console.log('👨‍💼 Admin: admin@edu-pwa.com (password: password123)');
  console.log('👨‍🏫 Educator 1: john.doe@edu-pwa.com (High activity, has bank account)');
  console.log('👩‍🏫 Educator 2: jane.smith@edu-pwa.com (Medium activity, has bank account)');
  console.log('👨‍🏫 Educator 3: mike.johnson@edu-pwa.com (Low activity, NO bank account)');
  console.log('👨‍🎓 Students: student1@edu-pwa.com to student25@edu-pwa.com');
  
  console.log('\n💰 November 2025 Settlement Test Data:');
  console.log(`📊 Total active Premium subscribers: ${totalActiveSubscribers}`);
  console.log(`💵 Total November revenue: ₦${Math.round(totalRevenue).toLocaleString()}`);
  console.log(`🎯 Total November points: ${Math.round(totalPoints)}`);
  console.log(`💎 Expected point value: ₦${expectedPointValue.toFixed(2)} per point`);
  
  console.log('\n📈 Subscription Breakdown:');
  console.log('• 8 Full-month Premium (₦1,000 each = ₦8,000)');
  console.log('• 5 Mid-month Premium (₦533 each = ₦2,665)');
  console.log('• 3 Yearly Premium (₦1,000 each = ₦3,000)');
  console.log('• 3 Multi-month Premium (₦367 each = ₦1,101)');
  console.log('• 4 Free users (₦0 revenue)');
  console.log('• 2 Expired Premium (₦0 revenue)');
  console.log('• 3 Expiring Today (for cron testing)');
  console.log('• 2 Grace Period (for status testing)');
  
  console.log('\n🎯 Activity Breakdown:');
  console.log('• Educator 1: 120 plays + 40 downloads + 25 live class attendees');
  console.log('• Educator 2: 80 plays + 25 downloads + 15 live class attendees');
  console.log('• Educator 3: 40 plays + 10 downloads + 8 live class attendees');
  
  console.log('\n🧪 Testing Instructions:');
  console.log('1. Run settlement: POST /api/cron/revamped-monthly-settlement?month=2025-11-01');
  console.log('2. Expected results:');
  console.log(`   - Total subscribers: ${totalActiveSubscribers}`);
  console.log(`   - Total revenue: ₦${Math.round(totalRevenue).toLocaleString()}`);
  console.log(`   - Point value: ₦${expectedPointValue.toFixed(2)}`);
  console.log('3. Test subscription updates: POST /api/cron/revamped-update-subscriptions');
  console.log('4. Test analytics dashboard (login as admin@edu-pwa.com)');
  console.log('5. Test settlement preview/trigger in admin panel');
  console.log('6. Check educator earnings distribution');
  
  console.log('\n🔧 Admin Testing:');
  console.log('• Login as admin@edu-pwa.com → Analytics → Settlements tab');
  console.log('• Preview November 2025 settlement');
  console.log('• Trigger settlement and verify results');
  console.log('• Check subscription status updates work correctly');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });