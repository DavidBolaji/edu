import { z } from 'zod';

const userMediaSchema = z.object({
  id: z.string(),
  name: z.string(),
  size: z.number(),
  format: z.string(),
  url: z.string(),
  type: z.enum(['AUDIO', 'VIDEO', 'EBOOK']),
  course: z.object({
    title: z.string(),
  }),
  level: z.object({
    name: z.string(),
  }),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type UserMedia = z.infer<typeof userMediaSchema>;

export const userMediaListSchema = z.array(userMediaSchema);
