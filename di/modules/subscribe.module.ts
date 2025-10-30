import { createModule } from '@evyweb/ioctopus';
import { DI_SYMBOLS } from '@/di/types';
import { SubscribeRepository } from '@/src/infrastructure/repositories/subscribe.repository';
import { subscribeToUserUseCase } from '@/src/application/use-case/subscribe/subscribe-to-user-use-case';
import { subscribeToUserController } from '@/src/controllers/subscribe/subscribe-to-user.controller';

export function createSubscribeModule() {
  const subscribeModule = createModule();

  if (process.env.NODE_ENV === 'test') {
    // certificationModule.bind(DI_SYMBOLS.IUserRepository).toClass(MockcertificationRepository);
  } else {
    subscribeModule
      .bind(DI_SYMBOLS.ISubscribeRepository)
      .toClass(SubscribeRepository);
  }
  // use case
  subscribeModule
    .bind(DI_SYMBOLS.ISubscribeToUserUseCase)
    .toHigherOrderFunction(subscribeToUserUseCase, [
      DI_SYMBOLS.ISubscribeRepository,
    ]);

  //controller
  subscribeModule
    .bind(DI_SYMBOLS.ISubscribeToUserController)
    .toHigherOrderFunction(subscribeToUserController, [
      DI_SYMBOLS.IAuthenticationService,
      DI_SYMBOLS.ISubscribeToUserUseCase,
    ]);

  return subscribeModule;
}
