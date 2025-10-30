import { z } from 'zod';

const levelSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Level = z.infer<typeof levelSchema>;

export const levelListSchema = z.array(levelSchema);
