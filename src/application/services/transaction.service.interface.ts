import { Prisma } from '@prisma/client';

export interface ITransactionService {
  startTransaction<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>,
    parentTx?: Prisma.TransactionClient
  ): Promise<T>;
}
