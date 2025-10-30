import { cn } from '@/app/_lib/utils';
import React from 'react';
import { Loader2 } from 'lucide-react';

const Spinner: React.FC<{ color?: string }> = ({ color = 'text-primary' }) => {
  return <Loader2 className={cn('h-8 w-8 animate-spin', color)} />;
};

export default Spinner;
