import { getDetails } from '@/app/dashboard/_services/user.services';
import QuizComponent from '../_components/quiz-component';
import { getUserQuiz } from '../../action';
interface QuizPageParams {
  params: { id: string };
}

export const revalidate = 0;
const QuizPage: React.FC<QuizPageParams> = async ({ params }) => {
  const tutorId = (await params)?.id;
  const user = await getDetails();
  const quiz = await getUserQuiz(tutorId);
  return <QuizComponent user={user} quizData={quiz} tutorId={tutorId} />;
};

export default QuizPage;
