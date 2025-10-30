import { ITransaction } from '@/src/entities/models/transaction';
import { Media } from '@prisma/client';

export interface IMediaRepository {
  getMediaDetails(userId: string): Promise<Media[]>;
  getUnviewedMedia(userId: string): Promise<Media[]>;
  //   createMedia(userId: string, tx?: ITransaction): Promise<void>;
}
