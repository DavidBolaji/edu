import { Cookie } from '@/src/entities/models/cookie';
import { IAuthenticationService } from '../../services/auth.service.interface';

export type ISignOutUseCase = ReturnType<typeof signOutUseCase>;

export const signOutUseCase =
  (authenticationService: IAuthenticationService) =>
  async (sessionId: string): Promise<{ blankCookie: Cookie }> => {
    try {
      return await authenticationService.invalidateSession(sessionId);
    } catch (error) {
      throw error;
    }
  };
