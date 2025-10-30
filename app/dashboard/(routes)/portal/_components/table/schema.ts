import { z } from 'zod';

const portalSchema = z.object({
  id: z.string(),
  desc: z.string(),
  course: z.string(),
  level: z.string(),
  type: z.enum(['EBOOK', 'VIDEO', 'AUDIO']),
  openDate: z.coerce.date(),
  closeDate: z.coerce.date(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  submissions: z.array(z.object({
    userId: z.string(),
    url: z.string()
  })),
  _count: z.object({
    submissions: z.number(),
  }),
});
export type Portal = z.infer<typeof portalSchema>;

export const portalListSchema = z.array(portalSchema);