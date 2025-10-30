'use client';

import React from 'react';
import { normalizeAnswer } from '../_services/scoreUtils';
import { SubmissionRow } from '../_services/types.server';

interface Props {
  submission: SubmissionRow;
  questions: any[];
  onClose: () => void;
}

export default function SubmissionModal({ submission, questions, onClose }: Props) {
  const { rawSubmission } = submission;
  const answers = rawSubmission?.answers || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-lg max-w-3xl w-full p-6 z-10 
                      max-h-[60vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold">
              Submission: {submission.user.fname} {submission.user.lname}
            </h2>
            <p className="text-sm text-gray-500">
              Scored {submission.score} / {questions.length}
            </p>
          </div>

          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            ✕
          </button>
        </div>

        {/* Scrollable Questions Area */}
        <div
          className="flex-1 overflow-y-auto pr-2"
          style={{
            scrollbarWidth: 'none', // Firefox
            msOverflowStyle: 'none', // IE & Edge
          }}
        >
          {/* Webkit-based scrollbars hidden */}
          <style>
            {`
              div::-webkit-scrollbar {
                display: none;
              }
            `}
          </style>

          {questions.map((q, idx) => {
            const userAns = answers?.[String(idx)];
            const correct = q.correctAnswers ?? [];

            const optionText = (opt: any) => {
              if (!q.options) return String(opt);
              if (typeof opt === 'number' && q.options[opt]) {
                const text = q.options[opt];
                return typeof text === 'string' ? text : text.text ?? text.label ?? JSON.stringify(text);
              }
              return String(opt);
            };

            const userTextDetailed = Array.isArray(userAns)
              ? userAns.map(optionText).join(', ')
              : optionText(userAns);

            const correctTextDetailed = Array.isArray(correct)
              ? correct.map(optionText).join(', ')
              : optionText(correct);

            const isCorrect = userTextDetailed === correctTextDetailed;

            return (
              <div key={q.id} className="p-3 border rounded mb-3">
                <div className="flex justify-between">
                  <div>
                    <div className="font-medium">
                      {idx + 1}. {q.question}
                    </div>
                    <ul className="text-sm ml-4 list-disc mt-1">
                      {q.options?.map((opt: any, i: number) => (
                        <li key={i}>
                          {typeof opt === 'string' ? opt : opt.text ?? opt.label ?? JSON.stringify(opt)}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div
                    className={`px-2 py-1 rounded text-sm ${
                      isCorrect
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {isCorrect ? 'Correct' : 'Wrong'}
                  </div>
                </div>

                <div className="mt-2 text-sm">
                  <p>
                    <strong>Correct:</strong> {correctTextDetailed}
                  </p>
                  <p>
                    <strong>User:</strong> {userTextDetailed || 'No answer'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
