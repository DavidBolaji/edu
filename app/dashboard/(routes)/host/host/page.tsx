
// app/dashboard/host/page.tsx
import React from 'react';
import { getQuizWithSubmissions, prepareSubmissionRows } from './_services/quiz.service';
import { SubmissionRow } from './_services/types.server';
import { QuizForm } from '../_components/form/quiz-form';
import QuizTableClient from './_components/quiz-table-client';

interface HostQuizPageProps {
  searchParams: { quiz?: string };
}

export const revalidate = 0;

const HostQuizPage = async ({ searchParams }: HostQuizPageProps) => {
  const quizParam = searchParams.quiz;

  if (!quizParam) {
    return <div className="p-6">
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Create a New Quiz</h1>
        <QuizForm submited={false} />
      </div>
    </div>
  }
  const parsed = JSON.parse(quizParam);
  const quizId = parsed.id as string;
  const quiz = await getQuizWithSubmissions(quizId);
  if (!quiz) return <div className="p-6">Quiz not found</div>;

  const rows: SubmissionRow[] = prepareSubmissionRows(quiz);
  const submited = rows.length > 0;

  return (
    <div className="p-6">
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Create a New Quiz</h1>
        <QuizForm submited={submited} />
      </div>

      {/* Pass prepared rows and the questions so the client modal can show full question text */}
      <QuizTableClient rows={rows} questions={quiz.questions} />
    </div>
  );
};

export default HostQuizPage;

