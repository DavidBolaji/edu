import db from "@/prisma";

export const getQuizSubmissions = async (quizId: string) => {
  const quiz = await db.quizSubmission.findMany({
    where: { quizId: quizId },
  });
  return quiz;
};