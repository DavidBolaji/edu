-- CreateTable
CREATE TABLE `Course` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Course_title_idx`(`title`),
    INDEX `Course_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Level` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Level_courseId_idx`(`courseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Media` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `size` INTEGER NOT NULL,
    `format` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `type` ENUM('AUDIO', 'VIDEO', 'EBOOK') NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `levelId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Media_name_idx`(`name`),
    INDEX `Media_courseId_idx`(`courseId`),
    INDEX `Media_levelId_idx`(`levelId`),
    INDEX `Media_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MediaView` (
    `id` VARCHAR(191) NOT NULL,
    `mediaId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `viewedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `MediaView_mediaId_idx`(`mediaId`),
    INDEX `MediaView_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Like` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `mediaId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Like_userId_idx`(`userId`),
    INDEX `Like_mediaId_idx`(`mediaId`),
    INDEX `Like_userId_mediaId_idx`(`userId`, `mediaId`),
    UNIQUE INDEX `Like_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LiveClass` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LiveClass_userId_idx`(`userId`),
    INDEX `LiveClass_id_idx`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LiveClassAttendee` (
    `id` VARCHAR(191) NOT NULL,
    `liveClassId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LiveClassAttendee_liveClassId_idx`(`liveClassId`),
    INDEX `LiveClassAttendee_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OfflineDownload` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `mediaId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `educatorId` VARCHAR(191) NOT NULL,

    INDEX `OfflineDownload_userId_idx`(`userId`),
    INDEX `OfflineDownload_mediaId_idx`(`mediaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Play` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `mediaId` VARCHAR(191) NOT NULL,
    `durationWatched` DOUBLE NULL,
    `mediaDuration` DOUBLE NULL,
    `watchRatio` DOUBLE NULL,
    `sessionId` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `ipAddress` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `educatorId` VARCHAR(191) NOT NULL,

    INDEX `Play_userId_idx`(`userId`),
    INDEX `Play_mediaId_idx`(`mediaId`),
    INDEX `Play_sessionId_idx`(`sessionId`),
    INDEX `Play_ipAddress_idx`(`ipAddress`),
    INDEX `Play_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Portal` (
    `id` VARCHAR(191) NOT NULL,
    `desc` VARCHAR(191) NOT NULL,
    `course` VARCHAR(191) NOT NULL,
    `level` VARCHAR(191) NOT NULL,
    `type` ENUM('AUDIO', 'VIDEO', 'EBOOK') NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `openDate` DATETIME(3) NOT NULL,
    `closeDate` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Portal_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Quiz` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `quizDate` DATETIME(3) NOT NULL,
    `duration` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Quiz_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Question` (
    `id` VARCHAR(191) NOT NULL,
    `quizId` VARCHAR(191) NOT NULL,
    `question` VARCHAR(191) NOT NULL,
    `options` JSON NOT NULL,
    `correctAnswers` JSON NOT NULL,
    `isMultiChoice` BOOLEAN NOT NULL,

    INDEX `Question_quizId_idx`(`quizId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuizSubmission` (
    `id` VARCHAR(191) NOT NULL,
    `quizId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `answers` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `educatorId` VARCHAR(191) NOT NULL,

    INDEX `QuizSubmission_quizId_idx`(`quizId`),
    INDEX `QuizSubmission_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Subscription` (
    `id` VARCHAR(191) NOT NULL,
    `subscriberId` VARCHAR(191) NOT NULL,
    `subscribedId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Subscription_subscriberId_idx`(`subscriberId`),
    INDEX `Subscription_subscribedId_idx`(`subscribedId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SubscriptionPlan` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `price` DOUBLE NOT NULL,
    `originalPrice` DOUBLE NULL,
    `discountPercent` DOUBLE NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `status` ENUM('ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED', 'TRIAL', 'GRACE_PERIOD', 'PENDING_RENEWAL') NOT NULL DEFAULT 'ACTIVE',
    `autoRenew` BOOLEAN NOT NULL DEFAULT true,
    `planType` ENUM('MONTHLY', 'QUARTERLY', 'YEARLY', 'LIFETIME') NOT NULL DEFAULT 'MONTHLY',
    `maxDownloads` INTEGER NULL,
    `maxLiveClasses` INTEGER NULL,
    `features` JSON NULL,
    `lastRenewalDate` DATETIME(3) NULL,
    `nextBillingDate` DATETIME(3) NULL,
    `gracePeriodEnds` DATETIME(3) NULL,
    `cancelledAt` DATETIME(3) NULL,
    `cancellationReason` VARCHAR(191) NULL,
    `trialEndsAt` DATETIME(3) NULL,
    `isTrialActive` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SubscriptionPlan_userId_key`(`userId`),
    INDEX `SubscriptionPlan_status_idx`(`status`),
    INDEX `SubscriptionPlan_expiresAt_idx`(`expiresAt`),
    INDEX `SubscriptionPlan_nextBillingDate_idx`(`nextBillingDate`),
    INDEX `SubscriptionPlan_planType_idx`(`planType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SubscriptionPayment` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `subscriptionId` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `originalAmount` DOUBLE NULL,
    `discountAmount` DOUBLE NULL,
    `months` INTEGER NOT NULL,
    `planType` ENUM('MONTHLY', 'QUARTERLY', 'YEARLY', 'LIFETIME') NOT NULL,
    `paymentMethod` VARCHAR(191) NULL,
    `paymentReference` VARCHAR(191) NULL,
    `paymentStatus` ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `paymentDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expirationBefore` DATETIME(3) NULL,
    `expirationAfter` DATETIME(3) NOT NULL,
    `isRenewal` BOOLEAN NOT NULL DEFAULT false,
    `renewalAttempt` INTEGER NOT NULL DEFAULT 1,
    `failureReason` VARCHAR(191) NULL,
    `refundAmount` DOUBLE NULL,
    `refundDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SubscriptionPayment_userId_idx`(`userId`),
    INDEX `SubscriptionPayment_paymentDate_idx`(`paymentDate`),
    INDEX `SubscriptionPayment_paymentStatus_idx`(`paymentStatus`),
    INDEX `SubscriptionPayment_subscriptionId_idx`(`subscriptionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Submission` (
    `id` VARCHAR(191) NOT NULL,
    `portalId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Submission_portalId_idx`(`portalId`),
    INDEX `Submission_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Session` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,

    INDEX `Session_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WebPush` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `pushUrl` LONGTEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `WebPush_userId_key`(`userId`),
    INDEX `WebPush_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SubscriptionUsage` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `month` DATETIME(3) NOT NULL,
    `downloadsUsed` INTEGER NOT NULL DEFAULT 0,
    `liveClassesUsed` INTEGER NOT NULL DEFAULT 0,
    `lastResetDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SubscriptionUsage_userId_idx`(`userId`),
    INDEX `SubscriptionUsage_month_idx`(`month`),
    UNIQUE INDEX `SubscriptionUsage_userId_month_key`(`userId`, `month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SubscriptionHistory` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `action` ENUM('CREATED', 'RENEWED', 'CANCELLED', 'EXPIRED', 'SUSPENDED', 'REACTIVATED', 'UPGRADED', 'DOWNGRADED', 'TRIAL_STARTED', 'TRIAL_ENDED', 'GRACE_PERIOD_STARTED') NOT NULL,
    `oldStatus` ENUM('ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED', 'TRIAL', 'GRACE_PERIOD', 'PENDING_RENEWAL') NULL,
    `newStatus` ENUM('ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED', 'TRIAL', 'GRACE_PERIOD', 'PENDING_RENEWAL') NOT NULL,
    `oldExpiryDate` DATETIME(3) NULL,
    `newExpiryDate` DATETIME(3) NULL,
    `reason` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SubscriptionHistory_userId_idx`(`userId`),
    INDEX `SubscriptionHistory_action_idx`(`action`),
    INDEX `SubscriptionHistory_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `fname` VARCHAR(191) NOT NULL,
    `lname` VARCHAR(191) NOT NULL,
    `middlename` VARCHAR(191) NOT NULL,
    `picture` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `school` VARCHAR(191) NOT NULL,
    `isLive` BOOLEAN NOT NULL DEFAULT false,
    `code` VARCHAR(191) NULL,
    `role` ENUM('STUDENT', 'LECTURER', 'ADMIN') NOT NULL,
    `bankName` VARCHAR(191) NULL,
    `accountNumber` VARCHAR(191) NULL,
    `accountName` VARCHAR(191) NULL,
    `bankCode` VARCHAR(191) NULL,
    `title` ENUM('Mr', 'Mrs', 'Ms', 'Dr', 'Professor') NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_phone_key`(`phone`),
    INDEX `User_email_phone_fname_idx`(`email`, `phone`, `fname`),
    INDEX `User_school_idx`(`school`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Transaction` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `type` ENUM('SUBSCRIPTION', 'TOPUP', 'PAYOUT') NOT NULL,
    `status` ENUM('PENDING', 'PAID') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Transaction_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Wallet` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL DEFAULT 0.00,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Wallet_userId_key`(`userId`),
    INDEX `Wallet_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WithdrawalRequest` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'PROCESSED') NOT NULL DEFAULT 'PENDING',
    `requestedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processedAt` DATETIME(3) NULL,
    `lastWithdrawal` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `WithdrawalRequest_userId_idx`(`userId`),
    INDEX `WithdrawalRequest_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MonthlySettlement` (
    `id` VARCHAR(191) NOT NULL,
    `month` DATETIME(3) NOT NULL,
    `totalSubscribers` INTEGER NOT NULL,
    `totalRevenue` DOUBLE NOT NULL,
    `totalPoints` INTEGER NOT NULL,
    `pointValue` DOUBLE NOT NULL,
    `status` ENUM('CALCULATING', 'FINALIZED') NOT NULL DEFAULT 'CALCULATING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `finalizedAt` DATETIME(3) NULL,

    INDEX `MonthlySettlement_month_idx`(`month`),
    INDEX `MonthlySettlement_status_idx`(`status`),
    UNIQUE INDEX `MonthlySettlement_month_key`(`month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EducatorMonthlyEarning` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `settlementId` VARCHAR(191) NOT NULL,
    `points` INTEGER NOT NULL,
    `earnings` DOUBLE NOT NULL,
    `withdrawn` DOUBLE NOT NULL DEFAULT 0,
    `availableBalance` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `EducatorMonthlyEarning_userId_idx`(`userId`),
    INDEX `EducatorMonthlyEarning_settlementId_idx`(`settlementId`),
    UNIQUE INDEX `EducatorMonthlyEarning_userId_settlementId_key`(`userId`, `settlementId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
