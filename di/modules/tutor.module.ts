import { createModule } from '@evyweb/ioctopus';
import { DI_SYMBOLS } from '@/di/types';
import { TutorRepository } from '@/src/infrastructure/repositories/tutor.repository';
import { getTutorsForUserUseCase } from '@/src/application/use-case/tutor/get-tutors-for-user-use-case';
import { getTutorsForUserController } from '@/src/controllers/tutor/get-tutors-for-user.controller';

export function createTutorModule() {
  const tutorModule = createModule();

  if (process.env.NODE_ENV === 'test') {
    // certificationModule.bind(DI_SYMBOLS.IUserRepository).toClass(MockcertificationRepository);
  } else {
    tutorModule.bind(DI_SYMBOLS.ITutorRepository).toClass(TutorRepository);
  }

  // use case
  tutorModule
    .bind(DI_SYMBOLS.IGetTutorsForUserUseCase)
    .toHigherOrderFunction(getTutorsForUserUseCase, [
      DI_SYMBOLS.ITutorRepository,
      DI_SYMBOLS.IUserRepository,
    ]);

  //controller
  tutorModule
    .bind(DI_SYMBOLS.IGetTutorsForUserController)
    .toHigherOrderFunction(getTutorsForUserController, [
      DI_SYMBOLS.IAuthenticationService,
      DI_SYMBOLS.IGetTutorsForUserUseCase,
    ]);

  return tutorModule;
}
