import { z } from 'zod';

const courseSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  _count: z.object({
    medias: z.number(),
    levels: z.number(),
  }),
});
export type Course = z.infer<typeof courseSchema>;

export const courseListSchema = z.array(courseSchema);
