import { IGetTutorsParams } from '@/src/entities/models/tutor';
import { User } from '@prisma/client';

export interface ITutorRepository {
  getTutors(
    school: string,
    userId: string,
    params: IGetTutorsParams
  ): Promise<User[]>;
}
