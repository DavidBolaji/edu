// app/dashboard/host/_components/QuizTableClient.tsx
'use client';

import React, { useState } from 'react';
import { SubmissionRow } from '../_services/types.server';
import SubmissionModal from './submission-modal';


interface Props {
  rows: SubmissionRow[];
  questions: any[]; // full questions from server
}

export default function QuizTableClient({ rows, questions }: Props) {
  const [selected, setSelected] = useState<SubmissionRow | null>(null);

  return (
    <div>
      <div className="mb-4">
        <input
          placeholder="Filter course..."
          className="border rounded px-3 py-2 w-64"
        />
      </div>

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left"><input type="checkbox" /></th>
              <th className="p-3 text-left">Description</th>
              <th className="p-3 text-left">User</th>
              <th className="p-3 text-left">Score</th>
              <th className="p-3 text-left">Submitted</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center">No submissions yet.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t hover:bg-gray-50">
                <td className="p-3"><input type="checkbox" /></td>
                <td className="p-3">Submission by {r.user.fname} {r.user.lname}</td>
                <td className="p-3">{r.user.fname} {r.user.lname}</td>
                <td className="p-3">{r.score} / {questions.length}</td>
                <td className="p-3">{new Date(r.createdAt).toLocaleString()}</td>
                <td className="p-3">
                  <button
                    onClick={() => setSelected(r)}
                    className="px-3 py-1 bg-blue-600 text-white rounded"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <SubmissionModal
          submission={selected}
          questions={questions}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
