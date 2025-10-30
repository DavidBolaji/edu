import { Input } from '@/app/_components/ui/input';
import React from 'react';

interface QuizDurationInputProps {
  value: string;
  onChange: (value: string) => void;
}

const QuizDurationInput: React.FC<QuizDurationInputProps> = ({
  value,
  onChange,
}) => (
  <Input
    type="number"
    placeholder="Quiz Duration (minutes)"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full border border-gray-300 p-2 mt-5 mb-5 rounded-lg text-black"
    inputMode="numeric"
    min={1}
  />
);

export default QuizDurationInput;
