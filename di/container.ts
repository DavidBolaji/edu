import { createContainer } from '@evyweb/ioctopus';
import { DI_RETURN_TYPES, DI_SYMBOLS } from './types';
import { createAuthenticationModule } from './modules/auth.module';
import { createUsersModule } from './modules/user.module';
import { createWalletModule } from './modules/wallet.module';
import { createTransactionModule } from './modules/transaction.module';
import { createMediaModule } from './modules/media.module';
import { createTutorModule } from './modules/tutor.module';
import { createSubscribeModule } from './modules/subscribe.module';
import { createSubscriptionModule } from './modules/subscription.modules';

const AppContainer = createContainer();

AppContainer.load(Symbol('UsersModule'), createUsersModule());
AppContainer.load(Symbol('AuthenticationModule'), createAuthenticationModule());
AppContainer.load(Symbol('MediaModule'), createMediaModule());
AppContainer.load(Symbol('SubscribeModule'), createSubscribeModule());
AppContainer.load(Symbol('SubscriptionModule'), createSubscriptionModule());
AppContainer.load(Symbol('TransactionModule'), createTransactionModule());
AppContainer.load(Symbol('TutorModule'), createTutorModule());
AppContainer.load(Symbol('WalletModule'), createWalletModule());

export function getInjection<K extends keyof typeof DI_SYMBOLS>(
  symbol: K
): DI_RETURN_TYPES[K] {
  return AppContainer.get(DI_SYMBOLS[symbol]);
}
