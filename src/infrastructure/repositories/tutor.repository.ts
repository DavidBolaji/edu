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
    const baseWhereClause: Prisma.UserWhereInput = {
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
      NOT: { id: userId },
    };

    try {
      // Get educators from same school first
      const sameSchoolEducators = await db.user.findMany({
        where: {
          ...baseWhereClause,
          school: school,
        },
        orderBy: [
          { fname: 'asc' },
          { lname: 'asc' }
        ]
      });

      // Get educators from other schools
      const otherSchoolEducators = await db.user.findMany({
        where: {
          ...baseWhereClause,
          school: { not: school },
        },
        orderBy: [
          { school: 'asc' },
          { fname: 'asc' },
          { lname: 'asc' }
        ]
      });

      // Combine results: same school first, then others
      return [...sameSchoolEducators, ...otherSchoolEducators];
    } catch (error) {
      throw error;
    }
  }
}
