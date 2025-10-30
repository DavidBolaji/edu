import { createModule } from '@evyweb/ioctopus';
import { DI_SYMBOLS } from '@/di/types';
import { MediaRepository } from '@/src/infrastructure/repositories/media.repository';
import { getMediaForUserController } from '@/src/controllers/media/get-media-for-user.controller';
import { getMediaForUserUseCase } from '@/src/application/use-case/media/get-media-for-user-use-case';
import { getMediaUnviewedForUserUseCase } from '@/src/application/use-case/media/get-media-unviewed-for-user-use-case';
import { getMediaUnviewedForUserController } from '@/src/controllers/media/get-media-unviewed-for-user.controller';

export function createMediaModule() {
  const mediaModule = createModule();

  if (process.env.NODE_ENV === 'test') {
    // certificationModule.bind(DI_SYMBOLS.IUserRepository).toClass(MockcertificationRepository);
  } else {
    mediaModule.bind(DI_SYMBOLS.IMediaRepository).toClass(MediaRepository);
  }

  // use case
  mediaModule
    .bind(DI_SYMBOLS.IGetMediaForUserUseCase)
    .toHigherOrderFunction(getMediaForUserUseCase, [
      DI_SYMBOLS.IMediaRepository,
    ]);
  mediaModule
    .bind(DI_SYMBOLS.IGetMediaUnviewedForUserUseCase)
    .toHigherOrderFunction(getMediaUnviewedForUserUseCase, [
      DI_SYMBOLS.IMediaRepository,
    ]);

  //controller
  mediaModule
    .bind(DI_SYMBOLS.IGetMediaForUserController)
    .toHigherOrderFunction(getMediaForUserController, [
      DI_SYMBOLS.IAuthenticationService,
      DI_SYMBOLS.IGetMediaForUserUseCase,
    ]);
  mediaModule
    .bind(DI_SYMBOLS.IGetMediaUnviewedForUserController)
    .toHigherOrderFunction(getMediaUnviewedForUserController, [
      DI_SYMBOLS.IAuthenticationService,
      DI_SYMBOLS.IGetMediaForUserUseCase,
    ]);

  return mediaModule;
}
