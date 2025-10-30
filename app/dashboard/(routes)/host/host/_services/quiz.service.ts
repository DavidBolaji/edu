// app/dashboard/_services/quiz.services.ts
import db from '@/prisma';
import { QuizWithDetails, SubmissionRow } from './types.server';
import { calculateSubmissionScore } from './scoreUtils';

export async function getQuizWithSubmissions(quizId: string) : Promise<QuizWithDetails | null> {
  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: true, // includes options, correctAnswers, isMultiChoice
      submissions: {
        include: {
          user: true, // include user info (fname, lname, id, etc)
        },
      },
    },
  });
  if (!quiz) return null;
  return quiz as unknown as QuizWithDetails;
}

/**
 * Prepare the presentation rows for the client table.
 * This computes the score for each submission and returns lightweight rows.
 */
export function prepareSubmissionRows(quiz: QuizWithDetails) : SubmissionRow[] {
  return quiz.submissions.map((s) => {
    const score = calculateSubmissionScore(quiz.questions, s.answers);
    return {
      id: s.id,
      url: `/dashboard/host/host?quiz=${encodeURIComponent(JSON.stringify({ id: quiz.id }))}`, // example
      user: {
        id: s.user.id,
        fname: s.user.fname ?? '',
        lname: s.user.lname ?? '',
      },
      score,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.createdAt.toISOString(),
      rawSubmission: s, // pass raw so modal can show full details
    };
  });
}
