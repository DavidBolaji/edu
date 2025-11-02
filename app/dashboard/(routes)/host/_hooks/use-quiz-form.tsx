import { useState, useEffect, startTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { toast } from 'sonner';
import { QuizFormValues } from '../_validations/quiz-schema';
import { combineDateTime } from '@/app/_lib/utils';
import { createQuiz, updateQuiz } from '../action';

export const useQuizForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quizParam = searchParams.get('quiz');
  const [initialValues, setInitialValues] = useState<QuizFormValues>({
    quizTitle: '',
    questions: [
      {
        question: '',
        options: [''],
        correctAnswers: [],
        isMultiChoice: false,
      },
    ],
    quizDate: new Date(),
    quizTime: new Date(),
    quizDuration: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (quizParam) {
      const parsedQuiz = JSON.parse(quizParam);
      setInitialValues({
        quizTitle: parsedQuiz.title,
        questions: parsedQuiz.questions,
        quizDate: new Date(parsedQuiz.quizDate),
        quizTime: new Date(parsedQuiz.quizDate),
        quizDuration: parsedQuiz.duration,
      });
    }
  }, [quizParam]);

  const handleSubmit = async (values: QuizFormValues) => {
    setLoading(true);
    const combinedDateTime = combineDateTime(values.quizDate, values.quizTime);
    const payload = {
      ...values,
      quizDate: combinedDateTime.toISOString(),
      quizDuration: parseInt(values.quizDuration.toString(), 10),
    } as unknown as QuizFormValues;

    try {
      if (quizParam) {
        await updateQuiz(JSON.parse(quizParam).id, payload);
      } else {
        await createQuiz(payload);
      }
      toast.success('Quiz saved successfully!');
      // start showing the loading bar
      ; (window as any).__showTopProgress?.()
        ; (window as any).__showOverlayLoading?.()
      // perform the navigation
      startTransition(() => {
        router.push('/dashboard/profile');
      })
    } catch (error: any) {
      toast.error('Error saving quiz', {
        description:
          error.response?.data?.error || 'An unexpected error occurred.',
      });
    } finally {
      setLoading(false);
    }
  };

  return { initialValues, handleSubmit, loading };
};
