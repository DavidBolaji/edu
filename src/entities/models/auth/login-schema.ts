import { z } from 'zod';

export const signInSchema = z.object({
  email: z.string().email({ message: 'Invalid email' }),
  password: z.string(),
});

export type signInSchemaType = z.infer<typeof signInSchema>;
