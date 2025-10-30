'use server';
import db from '@/prisma';
import { Question, Quiz } from './types';
import { QuizFormValues } from './_validations/quiz-schema';
import { getDetails } from '../../_services/user.services';

// export const fetchQuizzes = async () => {
//   const quiz = await db.quiz.findMany({
//     select: {
//       id: true,
//       title: true,
//       duration: true,
//       quizDate: true,
//       questions: {
//         select: {
//           id: true,
//           question: true,
//           options: true,
//           correctAnswers: true,
//           isMultiChoice: true,
//         },
//       },
//       submissions: {
//         select: {
//           userId: true,
//         },
//       },
//     },
//   });
//   return quiz as Quiz[];
// };

export const createQuiz = async (data: QuizFormValues) => {
  const user = await getDetails();

  const { quizTitle, quizDate, quizDuration, questions, quizTime } = data;
  await db.quiz.create({
    data: {
      title: quizTitle,
      userId: user.id, // Replace with actual user ID
      quizDate: quizDate,

      duration: quizDuration,
      questions: {
        create: questions.map((q: Question) => ({
          question: q.question,
          options: q.options,
          correctAnswers: q.correctAnswers,
          isMultiChoice: q.isMultiChoice,
        })),
      },
    },
  });
};

export const createQuizSubmission = async (data: any) => {
  const { quizId, answers, educatorId } = data;
  const userId = (await getDetails()).id;

  const quiz = await db.quizSubmission.create({
    data: {
      quizId,
      userId,
      answers,
      educatorId,
    },
  });

  return quiz;
};

export const getUserQuiz = async (userId: string) => {
  const quiz = await db.quiz.findMany({
    where: { userId },
    include: { questions: true, submissions: { select: { userId: true } } },
  });
  return quiz as Quiz[];
};

export const getQuiz = async (quizId: string) => {
  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    include: { questions: true, submissions: true },
  });
  return quiz;
};

export const getQuizUserSubmission = async (quizId: string, userId: string) => {
const quiz = await db.quiz.findFirst({
    where: {
      id: quizId,
      submissions: {
        some: {
          userId,
        },
      },
    },
    include: {
      submissions: {
        where: { userId },
      },
    },
  });
  return quiz;
};

export const updateQuiz = async (id: string, data: QuizFormValues) => {
  const { quizTitle, quizDate, quizDuration, questions } = data;
  const userId = (await getDetails()).id;

  const updatedQuiz = await db.quiz.update({
    where: { id: id, userId: userId },
    data: {
      title: quizTitle,
      quizDate: quizDate,
      duration: parseInt(quizDuration as unknown as string),
    },
  });

  // Then, delete existing questions
  await db.question.deleteMany({
    where: { quizId: id },
  });

  // Finally, create new questions
  await db.question.createMany({
    data: questions.map((q: Question) => ({
      quizId: id,
      question: q.question,
      options: q.options,
      correctAnswers: q.correctAnswers,
      isMultiChoice: q.isMultiChoice,
    })),
  });

  return updatedQuiz;
};

export const deleteManyQuiz = async (ids: string[]) => {
  try {
    await db.quiz.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return { message: 'Submissions deleted successfully' };
  } catch (error) {
    return { error: (error as Error).message };
  }
};
