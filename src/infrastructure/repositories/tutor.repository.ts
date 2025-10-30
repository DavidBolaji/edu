import { db } from '@/prisma';
import { ITutorRepository } from '@/src/application/repositories/tutor.repository.interface';
import { IGetTutorsParams } from '@/src/entities/models/tutor';

import { Prisma, User } from '@prisma/client';

export class TutorRepository implements ITutorRepository {
  constructor() {}

  async getTutors(
    school: string,
    userId: string,
    params: IGetTutorsParams
  ): Promise<User[]> {
    const whereClause: Prisma.UserWhereInput = {
      AND: [
        ...(params.search
          ? [
              {
                OR: [
                  { fname: { contains: params.search } },
                  { email: { contains: params.search } },
                ],
              },
            ]
          : []),
        { role: 'LECTURER' },
      ],
    };
    whereClause.NOT = { id: userId };
    whereClause.school = school;

    try {
      const user = await db.user.findMany({
        where: whereClause,
      });
      return user;
    } catch (error) {
      throw error;
    }
  }
}
