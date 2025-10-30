import { z } from 'zod';

export const quizZodSchema = z.object({
  quizTitle: z.string().min(1, 'Quiz title is required'),
  questions: z
    .array(
      z.object({
        question: z.string().min(1, 'Question is required'),
        options: z
          .array(z.string().min(1, 'Option is required'))
          .min(1, 'At least one option is required'),
        correctAnswers: z
          .array(z.number().nonnegative('Answer must be a number'))
          .min(1, 'At least one correct answer is required'),
        isMultiChoice: z.boolean(),
      })
    )
    .min(1, 'At least one question is required'),
  quizDate: z.date({ required_error: 'Quiz date is required' }),
  quizTime: z.date({ required_error: 'Quiz time is required' }),
  
  quizDuration: z.coerce
  .number({ invalid_type_error: 'Quiz duration must be a number' })
  .positive('Quiz duration must be positive'),
});

export type QuizFormValues = z.infer<typeof quizZodSchema>;
