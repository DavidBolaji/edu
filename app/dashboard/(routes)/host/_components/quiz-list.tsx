import { Quiz } from '../types';
import { QuizCard } from './quiz-card';

interface QuizListProps {
  quizzes: Quiz[];
}

export const QuizList = ({ quizzes }: QuizListProps) => {
  return (
    <div className="grid gap-4">
      {quizzes.map((quiz) => (
        <QuizCard key={quiz.id} quiz={quiz} />
      ))}
    </div>
  );
};
