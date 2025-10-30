import { allSignUpSchemaType } from '@/src/entities/models/auth/sign-up-schema';
import { ITransaction } from '@/src/entities/models/transaction';
import {
  ReturnUserDetail,
  User,
  UserWithPassword,
} from '@/src/entities/models/user';
import { ROLE, User as PUser } from '@prisma/client';

export interface IUsersRepository {
  getUser(id: string): Promise<PUser | undefined>;
  getUserByEmail(email: string): Promise<UserWithPassword | undefined>;
  getUserRole(id: string): Promise<ROLE | undefined>;
  getUserDetails(id: string): Promise<ReturnUserDetail | undefined>;
  createUser(input: allSignUpSchemaType, tx?: ITransaction): Promise<User>;
}
