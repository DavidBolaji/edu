import { IAuthenticationService } from '@/src/application/services/auth.service.interface';
import { ISignOutUseCase } from '@/src/application/use-case/auth/sign-out.use-case';
import { InputParseError } from '@/src/entities/error/common';

import { Cookie } from '@/src/entities/models/cookie';

export type ISignOutController = ReturnType<typeof signOutController>;

export const signOutController =
  (
    authenticationService: IAuthenticationService,
    signOutUseCase: ISignOutUseCase
  ) =>
  async (sessionId: string | undefined): Promise<Cookie> => {
    try {
      if (!sessionId) {
        throw new InputParseError('Must provide a session ID', {
          cause: 'Session ID absent',
        });
      }
      const { session } = await authenticationService.validateSession(
        sessionId
      );

      const { blankCookie } = await signOutUseCase(session.id);
      return blankCookie;
    } catch (error) {
      throw error;
    }
  };
