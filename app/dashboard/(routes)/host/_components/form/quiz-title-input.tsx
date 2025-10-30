// components/quiz/QuizTitleInput.tsx
import { Input } from '@/app/_components/ui/input';
import { Label } from '@/app/_components/ui/label';
import React from 'react';

interface QuizTitleInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
}

const QuizTitleInput: React.FC<QuizTitleInputProps> = ({
  value,
  onChange,
  error,
}) => (
  <div className="space-y-2">
    <Label htmlFor="quizTitle">Quiz Title</Label>
    <Input
      id="quizTitle"
      placeholder="Enter quiz title"
      value={value}
      onChange={onChange}
    />
    {error && <p className="text-sm text-red-500">{error}</p>}
  </div>
);

export default QuizTitleInput;
