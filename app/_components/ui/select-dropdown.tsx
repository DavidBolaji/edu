import { Loader } from 'lucide-react';
import { useFormikContext } from 'formik';
import { cn } from '@/app/_lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

interface SelectDropdownProps {
  onValueChange?: (value: string) => void;
  defaultValue: string | undefined;
  placeholder?: string;
  isPending?: boolean;
  items: { label: string; value: string }[] | undefined;
  disabled?: boolean;
  className?: string;
  isControlled?: boolean;
  name: string;
}

export function SelectDropdown({
  isPending,
  items,
  placeholder,
  disabled,
  className = '',
  name,
}: SelectDropdownProps) {
  const { getFieldProps, getFieldMeta, setFieldValue } = useFormikContext();

  const fieldProps = getFieldProps(name!);
  const { value } = getFieldMeta(name!);

  if (!fieldProps) {
    return null;
  }

  return (
    <Select
      onValueChange={(value) => {
        setFieldValue(name, value);
      }}
      defaultValue={(value as string) ?? ''}
    >
      <>
        <SelectTrigger disabled={disabled} className={cn(className)}>
          <SelectValue placeholder={placeholder ?? 'Select'} />
        </SelectTrigger>
      </>
      <SelectContent>
        {isPending ? (
          <SelectItem disabled value="loading" className="h-14">
            <div className="flex items-center justify-center gap-2">
              <Loader className="h-5 w-5 animate-spin" />
              {'  '}
              Loading...
            </div>
          </SelectItem>
        ) : (
          items?.map(({ label, value }) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
