'use client';

import React from 'react';
import { FieldArray } from 'formik';
import { Button } from '@/app/_components/ui/button';
import { Question } from '../../types';
import { Switch } from '@/app/_components/ui/switch';
import OptionItem from './option-item';
import { Input } from '@/app/_components/ui/input';
import { Label } from '@/app/_components/ui/label';
// adjust this import as needed

interface QuestionItemProps {
  question: Question;
  index: number;
  setFieldValue: (field: string, value: any) => void;
  onRemove: () => void;
  error?: string;
}

const QuestionItem: React.FC<QuestionItemProps> = ({
  question,
  index,
  setFieldValue,
  onRemove,
  error,
}) => {
  return (
    <div className="border p-4 rounded-lg space-y-4 mb-6 bg-muted/30">
      <h3 className="text-lg font-semibold text-primary">
        Question {index + 1}
      </h3>

      <Input
        type="text"
        placeholder={`Enter question ${index + 1}`}
        value={question.question}
        onChange={(e) =>
          setFieldValue(`questions[${index}].question`, e.target.value)
        }
        className="w-full p-2 border border-gray-300 rounded-md"
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex items-center gap-2">
        <Label htmlFor={`multi-${index}`} className="text-sm font-medium">
          Multi-choice:
        </Label>
        <Switch
          id={`multi-${index}`}
          checked={question.isMultiChoice}
          onCheckedChange={(checked) =>
            setFieldValue(`questions[${index}].isMultiChoice`, checked)
          }
        />
      </div>

      <FieldArray name={`questions[${index}].options`}>
        {({ push, remove }) => (
          <div className="space-y-3">
            {question.options.map((option, optionIndex) => (
              <OptionItem
                key={optionIndex}
                option={option}
                optionIndex={optionIndex}
                questionIndex={index}
                isCorrect={question.correctAnswers.includes(optionIndex)}
                isMultiChoice={question.isMultiChoice}
                setFieldValue={setFieldValue}
                onRemove={() => remove(optionIndex)}
                question={question}
              />
            ))}

            <Button
              type="button"
              onClick={() => push('')}
              className="mt-2"
              variant="secondary"
            >
              Add Option
            </Button>
          </div>
        )}
      </FieldArray>

      <Button
        type="button"
        variant="destructive"
        onClick={onRemove}
        className="mt-4"
      >
        Remove Question
      </Button>
    </div>
  );
};

export default QuestionItem;
