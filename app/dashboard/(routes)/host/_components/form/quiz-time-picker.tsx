'use client';

import { Label } from '@/app/_components/ui/label';
import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface QuizTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  error?: string;
}

const QuizTimePicker: React.FC<QuizTimePickerProps> = ({
  value,
  onChange,
  error,
}) => {
  const now = new Date();

  const isToday =
    value &&
    value.getFullYear() === now.getFullYear() &&
    value.getMonth() === now.getMonth() &&
    value.getDate() === now.getDate();

  return (
    <div className="mb-4">
      <Label className="block text-xs font-bold text-gray-700 mb-1">
        Select Quiz Time:
      </Label>
      <DatePicker
        selected={value}
        onChange={(date: Date | null) => {
          if (date) onChange(date);
        }}
        showTimeSelect
        showTimeSelectOnly
        timeIntervals={15}
        timeCaption="Time"
        dateFormat="h:mm aa"
        placeholderText="Select time"
        // minTime={isToday ? now : new Date(0, 0, 0, 0, 0)} // disables past times if today
        // maxTime={new Date(0, 0, 0, 23, 45)} // allows selection up to 11:45 PM
        className="w-full border border-gray-300 px-3 py-2 rounded-md text-black"
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default QuizTimePicker;
