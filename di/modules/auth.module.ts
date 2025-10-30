import { createModule } from '@evyweb/ioctopus';

import { DI_SYMBOLS } from '@/di/types';
import { AuthenticationService } from '@/src/infrastructure/services/auth.service';
import { signUpController } from '@/src/controllers/auth/sign-up.controller';
import { signUpUseCase } from '@/src/application/use-case/auth/sign-up-use-case';
import { signOutUseCase } from '@/src/application/use-case/auth/sign-out.use-case';
import { signOutController } from '@/src/controllers/auth/sign-out.controller';
import { signInController } from '@/src/controllers/auth/sign-in.controller';
import { signInUseCase } from '@/src/application/use-case/auth/sign-in-use-case';

export function createAuthenticationModule() {
  const authenticationModule = createModule();

  if (process.env.NODE_ENV === 'test') {
    // authenticationModule
    //   .bind(DI_SYMBOLS.IAuthenticationService)
    //   .toClass(MockAuthenticationService, [DI_SYMBOLS.IUsersRepository]);
  } else {
    authenticationModule
      .bind(DI_SYMBOLS.IAuthenticationService)
      .toClass(AuthenticationService, [DI_SYMBOLS.IUserRepository]);
  }

  // use case
  authenticationModule
    .bind(DI_SYMBOLS.ISignUpUseCase)
    .toHigherOrderFunction(signUpUseCase, [
      DI_SYMBOLS.IUserRepository,
      DI_SYMBOLS.IWalletRepository,
      DI_SYMBOLS.IAuthenticationService,
    ]);

  authenticationModule
    .bind(DI_SYMBOLS.ISignInUseCase)
    .toHigherOrderFunction(signInUseCase, [
      DI_SYMBOLS.IUserRepository,
      DI_SYMBOLS.IAuthenticationService,
    ]);

  authenticationModule
    .bind(DI_SYMBOLS.ISignOutUseCase)
    .toHigherOrderFunction(signOutUseCase, [DI_SYMBOLS.IAuthenticationService]);

  // controller
  authenticationModule
    .bind(DI_SYMBOLS.ISignUpController)
    .toHigherOrderFunction(signUpController, [
      DI_SYMBOLS.ISignUpUseCase,
      DI_SYMBOLS.ITransactionService,
    ]);

  authenticationModule
    .bind(DI_SYMBOLS.ISignInController)
    .toHigherOrderFunction(signInController, [DI_SYMBOLS.ISignInUseCase]);

  authenticationModule
    .bind(DI_SYMBOLS.ISignOutController)
    .toHigherOrderFunction(signOutController, [
      DI_SYMBOLS.IAuthenticationService,
      DI_SYMBOLS.ISignOutUseCase,
    ]);

  return authenticationModule;
}
