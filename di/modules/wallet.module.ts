import { createModule } from '@evyweb/ioctopus';
import { DI_SYMBOLS } from '@/di/types';
import { WalletRepository } from '@/src/infrastructure/repositories/wallet.repository';

export function createWalletModule() {
  const walletModule = createModule();

  if (process.env.NODE_ENV === 'test') {
    // certificationModule.bind(DI_SYMBOLS.IUserRepository).toClass(MockcertificationRepository);
  } else {
    walletModule.bind(DI_SYMBOLS.IWalletRepository).toClass(WalletRepository);
  }

  return walletModule;
}
