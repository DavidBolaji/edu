'use client';

import React from 'react';
import { FieldArray } from 'formik';
import { Question } from '../../types';
import { Button } from '@/app/_components/ui/button';
import QuestionItem from './question-item';

interface QuestionListProps {
  questions: Question[];
  setFieldValue: (field: string, value: any) => void;
  errors?: unknown;
}

const QuestionList: React.FC<QuestionListProps> = ({
  questions,
  setFieldValue,
  errors,
}) => (
  <FieldArray name="questions">
    {({ push, remove }) => (
      <div className="space-y-6 mt-6">
        {questions.map((question, index) => (
          <QuestionItem
            key={index}
            question={question}
            index={index}
            setFieldValue={setFieldValue}
            onRemove={() => remove(index)}
            error={
              Array.isArray(errors) && typeof errors[index] === 'object'
                ? errors[index].question
                : undefined
            }
          />
        ))}

        <Button
          type="button"
          onClick={() =>
            push({
              question: '',
              options: [''],
              correctAnswers: [],
              isMultiChoice: false,
            })
          }
          className="mt-4"
        >
          Add Question
        </Button>
      </div>
    )}
  </FieldArray>
);

export default QuestionList;
