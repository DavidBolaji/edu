'use client';

import { startTransition, useState } from 'react';
import { useRouter } from 'next/navigation';

import { EmptyState } from '@/app/_components/empty-state';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/_components/ui/alert-dialog';
import { AlertDialogCancel } from '@radix-ui/react-alert-dialog';
import { Separator } from '@/app/_components/ui/separator';
import { checkExpired } from '@/app/_lib/utils';
import { UserDetail } from '@/src/entities/models/user';
import { Quiz } from '../../types';
import { ScrollArea } from '@/app/_components/ui/scroll-area';
import QuizCard from './quiz-card';

const QuizComponent: React.FC<{
  user: UserDetail;
  quizData: Quiz[];
  tutorId: string;
}> = ({ user, quizData, tutorId }) => {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);

  const handleTakeQuiz = (quiz: Quiz) => {
    // if (checkExpired(user.subscriptionPlan?.expiresAt.toISOString() || '')) {
    //   alert('Upgrade to paid plan to take quiz');
    //   return;
    // }

    setSelectedQuiz(quiz);
    setDialogOpen(true);
  };

  const handleConfirm = () => {
    if (!selectedQuiz) return;

    const alreadySubmitted = selectedQuiz.submissions.some(
      (submission) => submission.userId === user.id
    );

    if (alreadySubmitted) {
      alert('You have already submitted this quiz');
      return;
    }

    // start showing the loading bar
    ; (window as any).__showTopProgress?.()
      ; (window as any).__showOverlayLoading?.()
    // perform the navigation
    startTransition(() => {
      router.push(`/dashboard/host/take/${selectedQuiz.id}_${tutorId}`);
    })

  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1>Available Quizzes</h1>
      <Separator className="my-4" />

      {quizData.length === 0 ? (
        <EmptyState
          title="No quiz found"
          subtitle="Wait for Educator to create one"
        />
      ) : (
        <ScrollArea className="space-y-4">
          {quizData.map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} onTakeQuiz={handleTakeQuiz} />
          ))}
        </ScrollArea>
      )}

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This quiz can only be taken once.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Take Quiz
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default QuizComponent;
