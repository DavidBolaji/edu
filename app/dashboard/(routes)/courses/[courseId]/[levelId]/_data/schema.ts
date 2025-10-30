import { z } from 'zod';

const mediaSchema = z.object({
  id: z.string(),
  name: z.string(),
  size: z.number(),
  format: z.string(),
  url: z.string(),
  type: z.enum(['AUDIO', 'VIDEO', 'EBOOK']),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Media = z.infer<typeof mediaSchema>;

export const mediaListSchema = z.array(mediaSchema);
