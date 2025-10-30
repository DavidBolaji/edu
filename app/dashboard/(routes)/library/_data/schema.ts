import { z } from 'zod';

const offlineMediaSchema = z.object({
  id: z.string(),
  name: z.string(),
  fileName: z.optional(z.string()),
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
export type OfflineMedia = z.infer<typeof offlineMediaSchema>;

export const offlineMediaListSchema = z.array(offlineMediaSchema);
