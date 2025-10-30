import { IUsersRepository } from '@/src/application/repositories/user.repository.interface';
import {
  ReturnUserDetail,
  User,
  UserWithPassword,
} from '@/src/entities/models/user';
import { db } from '@/prisma';
import { allSignUpSchemaType } from '@/src/entities/models/auth/sign-up-schema';
import { ROLE, User as PUser, Prisma } from '@prisma/client';
import { ITransaction } from '@/src/entities/models/transaction';

export class UsersRepository implements IUsersRepository {
  constructor() {}

  async getUserByEmail(email: string): Promise<UserWithPassword | undefined> {
    try {
      const user = await db.user.findUnique({
        where: {
          email,
        },
        select: {
          id: true,
          email: true,
          password: true,
        },
      });

      return user ? user : undefined;
    } catch (error) {
      throw error;
    }
  }

  async getUserRole(id: string): Promise<ROLE | undefined> {
    try {
      const role = await db.user.findUnique({
        where: {
          id,
        },
        select: {
          role: true,
        },
      });
      return role?.role;
    } catch (error) {
      throw error;
    }
  }

  async getUserDetails(id: string): Promise<ReturnUserDetail> {
    try {
      const user = await db.user.findUniqueOrThrow({
        where: {
          id,
        },
        include: {
          _count: {
            select: {
              courses: true,
              subscriptions: true,
            },
          },
          subscribers: {
            select: {
              subscribedId: true,
              subscriberId: true,
            },
          },
          subscriptions: {
            select: {
              subscriberId: true,
            },
          },
          courses: {
            include: {
              levels: true,
            },
          },
          subscriptionPlan: true,
        },
      });

      return user;
    } catch (error) {
      throw error;
    }
  }

  async getAllUser({
    page = 1,
    limit = 10,
    sort,
    sortOrder,
    searchQuery,
  }: any): Promise<any> {
    const skip = (page - 1) * limit;

    const whereClause: Prisma.UserWhereInput = {
      AND: [
        ...(searchQuery
          ? [
              {
                OR: [
                  { fname: { contains: searchQuery } },
                  { email: { contains: searchQuery } },
                ],
              },
            ]
          : []),
      ],
    };

    const orderBy: Prisma.UserOrderByWithRelationInput = {
      [sort as string]: sortOrder as Prisma.SortOrder,
    };
    try {
      const totalItems = await db.user.count({ where: whereClause });
      const users = await db.user.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy,
      });
      const totalPages = Math.ceil(totalItems / limit);
      return { users: users ?? [], totalPages };
    } catch (error) {
      throw error;
    }
  }

  async createUser(
    input: allSignUpSchemaType,
    tx?: ITransaction
  ): Promise<User> {
    const invoker = tx ?? db;
    try {
      const user = await invoker.user.create({
        data: {
          fname: input.fname,
          middlename: input.middlename,
          lname: input.lname,
          email: input.email,
          password: input.password,
          phone: input.phone,
          role: input.role,
          school: input.school,
        },
        select: {
          id: true,
          email: true,
        },
      });

      return user;
    } catch (error) {
      throw error;
    }
  }

  async getUser(id: string): Promise<PUser | undefined> {
    try {
      const user = await db.user.findFirstOrThrow({ where: { id } });
      return user;
    } catch (error) {
      throw error;
    }
  }
}
