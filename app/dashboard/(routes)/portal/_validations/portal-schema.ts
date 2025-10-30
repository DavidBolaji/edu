import { z } from 'zod';

export const portalZodSchema = z.object({
  course: z.string().min(1, 'Portal course is required'),
  type: z.string().min(1, 'Portal type is required'),
  desc: z.string().min(1, 'Portal description is required'),
  level: z.string().min(1, 'Portal level is required'),

  openDate: z.date({ required_error: 'Quiz date is required' }),
  closeDate: z.date({ required_error: 'Quiz time is required' }),
});

export type PortalFormValues = z.infer<typeof portalZodSchema>;
