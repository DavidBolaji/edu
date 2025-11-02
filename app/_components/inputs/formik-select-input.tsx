'use client';
import { useField, useFormikContext } from 'formik';
import React, { SelectHTMLAttributes } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/_components/ui/select';

import { Label } from '../ui/label';
import { cn } from '@/app/_lib/utils';
import Spinner from '../ui/spinner';

interface FormikSelectInputProp
  extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  placeholder?: string;
  options: { key: string; label: string }[] | [];
  handleChange?: (val: string) => void;
}

const FormikSelectInput = ({
  name,
  label,
  options,
  placeholder,
  handleChange,
  ...rest
}: FormikSelectInputProp) => {
  const [props] = useField(name as string);

  const { setFieldValue } = useFormikContext();
  const { className } = rest;

  return (
    <div>
      {label ? (
        <Label
          className="text-white ml-0.5 font-instrument font-semibold text-base mb-2 inline-block"
          htmlFor={name}
        >
          {label}
        </Label>
      ) : null}
      <Select
        key={options[0]?.label || 0}
        defaultValue={props.value}
        onValueChange={(val) => {
          setFieldValue(name!, val);
          if (handleChange) {
            handleChange(val);
          }
        }}
      >
        <SelectTrigger
          defaultValue={props.value}
          className={cn(
            'border-[#5C698A] h-[52px] focus:ring-0 focus:ring-offset-0 focus:outline-none font-instrument rounded-2xl bg-transparent',
            className
          )}
        >
          <SelectValue
            className="font-instrument"
            placeholder={placeholder || ''}
          />
        </SelectTrigger>
        <SelectContent className="bg-white">
          {options &&
            options.map((option) => (
              <SelectItem
                className="font-instrument focus:bg-primary focus:text-white"
                key={option.label}
                value={option.key}
              >
                {option.label}
              </SelectItem>
            ))}
          {!options && (
            <div className="w-full h-full flex items-center justify-center py-8">
              <Spinner color="text-primary" />
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default FormikSelectInput;
