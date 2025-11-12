import { IMediaRepository } from '@/src/application/repositories/media.repository.interface';
import { ISubscribeRepository } from '@/src/application/repositories/subscribe.repository.interface';
import { ISubscriptionRepository } from '@/src/application/repositories/subscription.repository.interface';
import { ITutorRepository } from '@/src/application/repositories/tutor.repository.interface';
import { IUsersRepository } from '@/src/application/repositories/user.repository.interface';
import { IWalletRepository } from '@/src/application/repositories/wallet.repositoty.interface';
import { IAuthenticationService } from '@/src/application/services/auth.service.interface';
import { ISubscriptionService } from '@/src/application/services/subscription.service.interface';
import { ITransactionService } from '@/src/application/services/transaction.service.interface';
import { ISignInUseCase } from '@/src/application/use-case/auth/sign-in-use-case';
import { ISignOutUseCase } from '@/src/application/use-case/auth/sign-out.use-case';
import { ISignUpUseCase } from '@/src/application/use-case/auth/sign-up-use-case';
import { IGetMediaForUserUseCase } from '@/src/application/use-case/media/get-media-for-user-use-case';
import { IGetMediaUnviewedForUserUseCase } from '@/src/application/use-case/media/get-media-unviewed-for-user-use-case';
import { ISubscribeToUserUseCase } from '@/src/application/use-case/subscribe/subscribe-to-user-use-case';
import { ISendPushUseCase } from '@/src/application/use-case/subscription/send-push-use-case';
import { ISubscribeToPushNotificationUseCase } from '@/src/application/use-case/subscription/subscribe-to-push-notification-use-case';
import { IGetTutorsForUserUseCase } from '@/src/application/use-case/tutor/get-tutors-for-user-use-case';
import { IGetDetailForUserUseCase } from '@/src/application/use-case/user/get-detail-for-user-use-case';
import { IGetSingleUserUseCase } from '@/src/application/use-case/user/get-single-user-use-case';
import { ISignInController } from '@/src/controllers/auth/sign-in.controller';
import { ISignOutController } from '@/src/controllers/auth/sign-out.controller';
import { ISignUpController } from '@/src/controllers/auth/sign-up.controller';
import { IGetMediaForUserController } from '@/src/controllers/media/get-media-for-user.controller';
import { IGetMediaUnviewedForUserController } from '@/src/controllers/media/get-media-unviewed-for-user.controller';
import { ISubscribeToUserController } from '@/src/controllers/subscribe/subscribe-to-user.controller';
import { ISendPushController } from '@/src/controllers/subscription/send-push.controller';
import { ISubscribeToPushNotificationController } from '@/src/controllers/subscription/subscribe-to-push-notification.controller';
import { IGetTutorsForUserController } from '@/src/controllers/tutor/get-tutors-for-user.controller';
import { IGetDetailsForUserController } from '@/src/controllers/users/get-details-for-user.controller';
import { IGetSingleUserController } from '@/src/controllers/users/get-single-user.controller';
import { IMediaPlayer, IPlaybackStateManager, IPlaybackPersistence, IStateSynchronization, IMediaUIController } from '@/src/entities/models/media-player';

export const DI_SYMBOLS = {
  // services
  IAuthenticationService: Symbol.for('IAuthenticationService'),
  ITransactionService: Symbol.for('ITransactionService'),
  ISubscriptionService: Symbol.for('ISubscriptionService'),

  // controllers
  ISignUpController: Symbol.for('ISignUpController'),
  ISignInController: Symbol.for('ISignInController'),
  ISignOutController: Symbol.for('ISignOutController'),
  IGetDetailsForUserController: Symbol.for('IGetDetailsForUserController'),
  IGetMediaForUserController: Symbol.for('IGetMediaForUserController'),
  IGetMediaUnviewedForUserController: Symbol.for(
    'IGetMediaUnviewedForUserController'
  ),
  IGetTutorsForUserController: Symbol.for('IGetTutorsForUserController'),
  IGetSingleUserController: Symbol.for('IGetSingleUserController'),
  ISubscribeToUserController: Symbol.for('ISubscribeToUserController'),
  ISubscribeToPushNotificationController: Symbol.for(
    'ISubscribeToPushNotificationController'
  ),
  ISendPushController: Symbol.for('ISendPushController'),

  // use case
  ISignUpUseCase: Symbol.for('ISignUpUseCase'),
  ISignInUseCase: Symbol.for('ISignInUseCase'),
  ISignOutUseCase: Symbol.for('ISignOutUseCase'),
  IGetDetailsForUserUseCase: Symbol.for('IGetDetailsForUserUseCase'),
  IGetMediaForUserUseCase: Symbol.for('IGetMediaForUserUseCase'),
  IGetMediaUnviewedForUserUseCase: Symbol.for(
    'IGetMediaUnviewedForUserUseCase'
  ),
  IGetTutorsForUserUseCase: Symbol.for('IGetTutorsForUserUseCase'),
  IGetSingleUserUseCase: Symbol.for('IGetSingleUserUseCase'),
  ISubscribeToUserUseCase: Symbol.for('ISubscribeToUserUseCase'),
  ISubscribeToPushNotificationUseCase: Symbol.for(
    'ISubscribeToPushNotificationUseCase'
  ),
  ISendPushUseCase: Symbol.for('ISendPushUseCase'),

  // repository
  IUserRepository: Symbol.for('IUserRepository'),
  IMediaRepository: Symbol.for('IMediaRepository'),
  ISubscribeRepository: Symbol.for('ISubscribeRepository'),
  ISubscriptionRepository: Symbol.for('ISubscriptionRepository'),
  ITutorRepository: Symbol.for('ITutorRepository'),
  IWalletRepository: Symbol.for('IWalletRepository'),

  // media player services
  IMediaPlayer: Symbol.for('IMediaPlayer'),
  IPlaybackStateManager: Symbol.for('IPlaybackStateManager'),
  IPlaybackPersistence: Symbol.for('IPlaybackPersistence'),
  IStateSynchronization: Symbol.for('IStateSynchronization'),
  IMediaUIController: Symbol.for('IMediaUIController'),
};

export interface DI_RETURN_TYPES {
  IAuthenticationService: IAuthenticationService;
  ITransactionService: ITransactionService;
  ISubscriptionService: ISubscriptionService;

  // controller
  ISignUpController: ISignUpController;
  ISignInController: ISignInController;
  ISignOutController: ISignOutController;
  IGetDetailsForUserController: IGetDetailsForUserController;
  IGetMediaForUserController: IGetMediaForUserController;
  IGetMediaUnviewedForUserController: IGetMediaUnviewedForUserController;
  IGetTutorsForUserController: IGetTutorsForUserController;
  IGetSingleUserController: IGetSingleUserController;
  ISubscribeToUserController: ISubscribeToUserController;
  ISubscribeToPushNotificationController: ISubscribeToPushNotificationController;
  ISendPushController: ISendPushController;
  // use case
  ISignUpUseCase: ISignUpUseCase;
  ISignInUseCase: ISignInUseCase;
  ISignOutUseCase: ISignOutUseCase;
  IGetDetailsForUserUseCase: IGetDetailForUserUseCase;
  IGetMediaForUserUseCase: IGetMediaForUserUseCase;
  IGetMediaUnviewedForUserUseCase: IGetMediaUnviewedForUserUseCase;
  IGetTutorsForUserUseCase: IGetTutorsForUserUseCase;
  IGetSingleUserUseCase: IGetSingleUserUseCase;
  ISubscribeToUserUseCase: ISubscribeToUserUseCase;
  ISubscribeToPushNotificationUseCase: ISubscribeToPushNotificationUseCase;
  ISendPushUseCase: ISendPushUseCase;

  // Repository
  IUserRepository: IUsersRepository;
  IMediaRepository: IMediaRepository;
  ISubscribeRepository: ISubscribeRepository;
  ISubscriptionRepository: ISubscriptionRepository;
  ITutorRepository: ITutorRepository;
  IWalletRepository: IWalletRepository;

  // Media Player Services
  IMediaPlayer: IMediaPlayer;
  IPlaybackStateManager: IPlaybackStateManager;
  IPlaybackPersistence: IPlaybackPersistence;
  IStateSynchronization: IStateSynchronization;
  IMediaUIController: IMediaUIController;
}
