import { db } from '@/prisma';
import { IWalletRepository } from '@/src/application/repositories/wallet.repositoty.interface';

import { ITransaction } from '@/src/entities/models/transaction';
import { Wallet } from '@prisma/client';

export class WalletRepository implements IWalletRepository {
  constructor() {}

  async getWalletDetails(userId: string): Promise<Wallet> {
    try {
      const wallet = db.wallet.findUniqueOrThrow({ where: { userId } });
      return wallet;
    } catch (error) {
      throw error;
    }
  }

  async createWallet(userId: string, tx?: ITransaction): Promise<void> {
    const invoker = tx ?? db;
    try {
      await invoker.wallet.create({
        data: {
          userId,
        },
      });
    } catch (error) {
      throw error;
    }
  }
}
