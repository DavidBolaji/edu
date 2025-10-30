import { useEffect, useState } from 'react';

import { toast } from 'sonner';
import { Quiz } from '../types';
import { getUserQuiz } from '../action';
import { getDetails } from '@/app/dashboard/_services/user.services';

export const useQuizzes = () => {
  const [quizzes, setQuizzes] = useState<Quiz[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const user = await getDetails()
        const data = await getUserQuiz(user.id);
        setQuizzes(data);
      } catch (error: any) {
        toast.error('Failed to fetch quizzes', {
          description: error?.response?.data?.error ?? 'An error occurred',
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return { quizzes, loading };
};
