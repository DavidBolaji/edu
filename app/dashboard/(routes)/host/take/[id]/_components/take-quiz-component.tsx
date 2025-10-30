'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Card } from '@/app/_components/ui/card';
import { Question, Quiz } from '../../../types';
import { Separator } from '@/app/_components/ui/separator';
import { Button } from '@/app/_components/ui/button';
import QuestionBlock from '../../_components/question-block';
import { createQuizSubmission } from '../../../action';

interface UserAnswers {
  [questionIndex: number]: number[];
}

export const TakeQuizComponent: React.FC<{
  quizData: Quiz;
  educatorId: string;
}> = ({ quizData, educatorId }) => {
  const router = useRouter();

  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timer setup
  useEffect(() => {
    if (!quizData) return;
    setTimeLeft(quizData.duration * 60);

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          submitQuiz();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue =
        'Are you sure you want to leave? Quiz can only be taken once.';
    };
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      clearInterval(timer);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [quizData]);

  const handleAnswer = (qIdx: number, oIdx: number, isMultiChoice: boolean) => {
    setUserAnswers((prev) => {
      const updated = { ...prev };
      if (isMultiChoice) {
        const exists = updated[qIdx] ?? [];
        updated[qIdx] = exists.includes(oIdx)
          ? exists.filter((i) => i !== oIdx)
          : [...exists, oIdx];
      } else {
        updated[qIdx] = [oIdx];
      }
      return updated;
    });
  };

  const submitQuiz = async () => {
    setIsSubmitting(true);
    try {
      await createQuizSubmission({
        quizId: quizData.id,
        answers: userAnswers,
        educatorId,
      });
      toast.success('Quiz submitted successfully!');
      router.push('/dashboard/home');
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!quizData) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <Card className="p-4 space-y-2">
        <h1 className="text-2xl font-bold">{quizData.title}</h1>
        <p className="text-sm text-muted-foreground">
          Time left: {Math.floor(timeLeft / 60)}:
          {(timeLeft % 60).toString().padStart(2, '0')}
        </p>
      </Card>

      {quizData.questions.map((q: Question, idx: number) => (
        <QuestionBlock
          key={idx}
          question={q}
          questionIndex={idx}
          selectedAnswers={userAnswers[idx] || []}
          onAnswer={(oIdx) => handleAnswer(idx, oIdx, q.isMultiChoice)}
        />
      ))}

      <Separator />
      <Button onClick={submitQuiz} disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
      </Button>
    </div>
  );
};
