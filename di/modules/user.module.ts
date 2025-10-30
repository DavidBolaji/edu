import { createModule } from '@evyweb/ioctopus';
import { DI_SYMBOLS } from '@/di/types';
import { UsersRepository } from '@/src/infrastructure/repositories/user.repository';
import { getDetailForUserController } from '@/src/controllers/users/get-details-for-user.controller';
import { getDetailForUserUseCase } from '@/src/application/use-case/user/get-detail-for-user-use-case';
import { getSingleUserController } from '@/src/controllers/users/get-single-user.controller';
import { getSingleUserUseCase } from '@/src/application/use-case/user/get-single-user-use-case';

export function createUsersModule() {
  const usersModule = createModule();

  if (process.env.NODE_ENV === 'test') {
    // usersModule.bind(DI_SYMBOLS.IUserRepository).toClass(MockUsersRepository);
  } else {
    usersModule.bind(DI_SYMBOLS.IUserRepository).toClass(UsersRepository);
  }
  // use case
  usersModule
    .bind(DI_SYMBOLS.IGetDetailsForUserUseCase)
    .toHigherOrderFunction(getDetailForUserUseCase, [
      DI_SYMBOLS.IUserRepository,
      DI_SYMBOLS.IWalletRepository,
    ]);

  usersModule
    .bind(DI_SYMBOLS.IGetSingleUserUseCase)
    .toHigherOrderFunction(getSingleUserUseCase, [
      DI_SYMBOLS.IUserRepository,
      DI_SYMBOLS.IMediaRepository,
    ]);

  //controller
  usersModule
    .bind(DI_SYMBOLS.IGetDetailsForUserController)
    .toHigherOrderFunction(getDetailForUserController, [
      DI_SYMBOLS.IAuthenticationService,
      DI_SYMBOLS.IGetDetailsForUserUseCase,
    ]);

  usersModule
    .bind(DI_SYMBOLS.IGetSingleUserController)
    .toHigherOrderFunction(getSingleUserController, [
      DI_SYMBOLS.IGetSingleUserUseCase,
      DI_SYMBOLS.IAuthenticationService,
    ]);

  return usersModule;
}
