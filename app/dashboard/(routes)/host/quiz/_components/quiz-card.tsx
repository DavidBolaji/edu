import { formatDateToCustomString } from '@/app/_lib/utils';
import { Quiz } from '../../types';
import { Button } from '@/app/_components/ui/button';
import { Card } from '@/app/_components/ui/card';

interface Props {
  quiz: Quiz;
  onTakeQuiz: (quiz: Quiz) => void;
}

const QuizCard = ({ quiz, onTakeQuiz }: Props) => (
  <Card className="p-6 space-y-2">
    <h3 className="text-lg font-semibold text-gray-800">{quiz.title}</h3>
    <p className="text-sm text-gray-600 italic">
      Closes: {formatDateToCustomString(quiz.quizDate as unknown as string)}
    </p>
    <Button onClick={() => onTakeQuiz(quiz)} className="mt-2">
      Take Quiz
    </Button>
  </Card>
);

export default QuizCard;
