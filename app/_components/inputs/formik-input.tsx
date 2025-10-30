'use client';
import { useField } from 'formik';
import React, { InputHTMLAttributes } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { cn } from '@/app/_lib/utils';

interface FormikInputProp extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  amount?: boolean;
}

const FormikInput: React.FC<FormikInputProp> = ({
  name,
  label,
  amount = false,
  ...rest
}) => {
  const [props] = useField(name || '');
  const { className, placeholder, ...prop } = rest;

  // Handle currency formatting
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // if (amount) {
    //   const value = e.target.value.replace(/[^0-9.]/g, '');
    //   // const formattedValue = parseIntToCurrency(value);

    //   e.target.value = formattedValue;
    // }
    props.onChange(e);
  };

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
      <Input
        {...props}
        {...prop}
        placeholder={placeholder || label || ''}
        onChange={handleChange}
        className={cn(
          'border-[#5C698A] h-[52px] focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none font-instrument rounded-2xl bg-transparent',
          className
        )}
      />
    </div>
  );
};

export default FormikInput;
