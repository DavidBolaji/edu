'use client';

import { Button } from '@/app/_components/ui/button';
import { Input } from '@/app/_components/ui/input';
import React from 'react';

interface OptionItemProps {
  option: string;
  optionIndex: number;
  questionIndex: number;
  isCorrect: boolean;
  isMultiChoice: boolean;
  setFieldValue: (field: string, value: any) => void;
  onRemove: () => void;
  question: {
    correctAnswers: number[];
  };
}

const OptionItem: React.FC<OptionItemProps> = ({
  option,
  optionIndex,
  questionIndex,
  isCorrect,
  isMultiChoice,
  setFieldValue,
  onRemove,
  question,
}) => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  const toggleCorrectAnswer = () => {
    setFieldValue(
      `questions[${questionIndex}].correctAnswers`,
      isMultiChoice
        ? isCorrect
          ? question.correctAnswers.filter((i) => i !== optionIndex)
          : [...question.correctAnswers, optionIndex]
        : [optionIndex]
    );
  };

  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-base font-medium w-5">
        {alphabet[optionIndex]}.
      </span>

      <Input
        type="text"
        placeholder={`Option ${optionIndex + 1}`}
        value={option}
        onChange={(e) =>
          setFieldValue(
            `questions[${questionIndex}].options[${optionIndex}]`,
            e.target.value
          )
        }
        className="flex-1 border border-gray-300 px-3 py-2 rounded-md text-sm"
      />

      <Button
        type="button"
        variant={isCorrect ? 'default' : 'outline'}
        onClick={toggleCorrectAnswer}
        className="w-10 h-10 text-center p-0"
      >
        {isCorrect ? '✓' : ''}
      </Button>

      <Button
        type="button"
        variant="destructive"
        onClick={onRemove}
        className="w-10 h-10 text-center p-0"
      >
        ✕
      </Button>
    </div>
  );
};

export default OptionItem;
