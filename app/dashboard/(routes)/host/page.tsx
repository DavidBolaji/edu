'use client';

import { useRouter } from 'next/navigation';
import { Loader2, Plus } from 'lucide-react';
import { useQuizzes } from './_hooks/use-quiz';
import { Button } from '@/app/_components/ui/button';
import { QuizList } from './_components/quiz-list';
import { EmptyState } from '@/app/_components/empty-state';

const ViewQuizPage = () => {
  const { quizzes, loading } = useQuizzes();
  const router = useRouter();

  if (loading) {
    return <Loader2 className="w-8 h-8 animate-spin" />;
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">All Quizzes</h1>
        <Button onClick={() => router.push('/dashboard/host/host')}>
          <Plus className="mr-2 h-4 w-4" />
          New Quiz
        </Button>
      </div>

      {quizzes && quizzes.length > 0 ? (
        <QuizList quizzes={quizzes} />
      ) : (
        <EmptyState
          title="No quiz created"
          subtitle="You can create one by clicking the button above"
        />
      )}
    </div>
  );
};

export default ViewQuizPage;
