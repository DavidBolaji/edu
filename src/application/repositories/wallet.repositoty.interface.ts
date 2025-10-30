import { ITransaction } from '@/src/entities/models/transaction';
import { Wallet } from '@prisma/client';

export interface IWalletRepository {
  getWalletDetails(userId: string): Promise<Wallet>;
  createWallet(userId: string, tx?: ITransaction): Promise<void>;
}
