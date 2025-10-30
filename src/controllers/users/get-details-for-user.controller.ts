import { IAuthenticationService } from '@/src/application/services/auth.service.interface';
import { IGetDetailForUserUseCase } from '@/src/application/use-case/user/get-detail-for-user-use-case';
import { UnauthenticatedError } from '@/src/entities/error/auth';
import { ReturnUserDetail, UserDetail } from '@/src/entities/models/user';
import { Wallet } from '@prisma/client';

export type IGetDetailsForUserController = ReturnType<
  typeof getDetailForUserController
>;

function presenter(user: ReturnUserDetail, wallet: Wallet): UserDetail {
  return {
    id: user.id,
    fname: user.fname,
    lname: user.lname,
    email: user.email,
    initials: user.initials,
    picture: user.picture,
    phone: user.phone,
    role: user.role,
    isLive: user.isLive,
    code: user.code,
    school: user.school,
    _count: user._count,
    wallet: {
      amount: wallet.amount,
    },
    subscriptions: user.subscribers.map((el) => el.subscribedId),
    subscriptionPlan: user.subscriptionPlan,
    courses: user.courses,
  };
}

export const getDetailForUserController =
  (
    authenticationService: IAuthenticationService,
    getDetailsForUserUseCase: IGetDetailForUserUseCase
  ) =>
  async (
    sessionId: string | undefined
  ): Promise<ReturnType<typeof presenter>> => {
    try {
      if (!sessionId) {
        throw new UnauthenticatedError('Must be logged in to get details');
      }
      const { session } = await authenticationService.validateSession(
        sessionId
      );

      const { user, wallet } = await getDetailsForUserUseCase(session.userId);
      return presenter(user, wallet);
    } catch (error) {
      throw new Error((error as Error).message);
    }
  };
