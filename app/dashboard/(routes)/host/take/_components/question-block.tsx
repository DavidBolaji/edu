import { Card } from '@/app/_components/ui/card';
import { Question } from '../../types';
import OptionButton from './option-button';

interface Props {
  question: Question;
  questionIndex: number;
  selectedAnswers: number[];
  onAnswer: (optionIndex: number) => void;
}

const QuestionBlock = ({
  question,
  questionIndex,
  selectedAnswers,
  onAnswer,
}: Props) => (
  <Card className="p-4 space-y-3">
    <h2 className="text-lg font-semibold">
      {questionIndex + 1}. {question.question}
    </h2>
    <div className="grid gap-2">
      {question.options.map((opt, idx) => (
        <OptionButton
          key={idx}
          label={opt}
          active={selectedAnswers.includes(idx)}
          onClick={() => onAnswer(idx)}
        />
      ))}
    </div>
  </Card>
);

export default QuestionBlock;
