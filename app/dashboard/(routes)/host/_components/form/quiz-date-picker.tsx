'use client';

import React from 'react';
import DatePicker from 'react-datepicker';

interface QuizDatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  error?: string;
}

const QuizDatePicker: React.FC<QuizDatePickerProps> = ({
  value,
  onChange,
  error,
}) => {
  return (
    <div className="mb-4">
      <label className="block text-xs font-bold text-gray-700 mb-1">
        Select Quiz Date:
      </label>
      <DatePicker
        selected={value}
        onChange={(date: Date | null) => {
          if (date) onChange(date);
        }}
        dateFormat="yyyy-MM-dd"
        placeholderText="Select a date"
        className="w-full border border-gray-300 px-3 py-2 rounded-md text-black"
        minDate={new Date()}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default QuizDatePicker;
