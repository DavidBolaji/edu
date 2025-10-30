import { getDetails } from '@/app/dashboard/_services/user.services';
import { getQuiz, getQuizUserSubmission } from '../../action';
import { Quiz } from '../../types';
import { TakeQuizComponent } from './_components/take-quiz-component';
import { RedirectMessage } from './_components/redirect-message';


interface TakeQuizPageParams {
  params: { id: string };
}

export const revalidate = 0;

const TakeQuizPage = async ({ params }: TakeQuizPageParams) => {
  const id = (await params)?.id;
  const user = await getDetails();
  const [quizId, educatorId] = id.split('_');

  // Not logged in
  if (!user) {
    return (
      <RedirectMessage
        message="You must have an account and be logged in to take this quiz."
        redirectUrl="/"
      />
    );
  }

  const quiz = await getQuiz(quizId);
  const quizSubmission = await getQuizUserSubmission(quizId, user.id);

  console.log(quizSubmission)
  // Already submitted
  if (quizSubmission) {
    return (
      <RedirectMessage
        message="You’ve already taken this quiz."
        redirectUrl={`/dashboard/host/quiz/${educatorId}`}
      />
    );
  }

  return (
    <TakeQuizComponent
      quizData={quiz as Quiz}
      educatorId={educatorId}
    />
  );
};

export default TakeQuizPage;
