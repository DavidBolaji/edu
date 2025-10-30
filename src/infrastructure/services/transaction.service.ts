import db from '@/prisma';
import { ITransactionService } from '@/src/application/services/transaction.service.interface';
import { Prisma, PrismaClient } from '@prisma/client';

export class TransactionService implements ITransactionService {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || db; // Use passed instance or default to global db instance
  }

  /**
   * Wraps an async function in a Prisma transaction.
   * @param callback Function containing database operations
   * @param parentTx Optional parent transaction (for nested transactions)
   */
  async startTransaction<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>,
    parentTx?: Prisma.TransactionClient
  ): Promise<T> {
    if (parentTx) {
      // If a parent transaction exists, use it to create a savepoint
      return await callback(parentTx);
    }

    return await this.prisma.$transaction(async (tx) => {
      try {
        return await callback(tx);
      } catch (error) {
        console.error('Transaction failed:', error);
        throw error; // Let the caller handle rollback if needed
      }
    });
  }
}
