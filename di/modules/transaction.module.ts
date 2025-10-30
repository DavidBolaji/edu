import { createModule } from '@evyweb/ioctopus';
import { DI_SYMBOLS } from '@/di/types';
import { TransactionService } from '@/src/infrastructure/services/transaction.service';

export function createTransactionModule() {
  const transactionModule = createModule();

  if (process.env.NODE_ENV === 'test') {
    // certificationModule.bind(DI_SYMBOLS.IUserRepository).toClass(MockcertificationRepository);
  } else {
    transactionModule
      .bind(DI_SYMBOLS.ITransactionService)
      .toClass(TransactionService);
  }

  return transactionModule;
}
