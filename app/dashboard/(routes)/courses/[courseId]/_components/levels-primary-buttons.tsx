'use client';

import { StepForward } from 'lucide-react';
import { useLevelContext } from '../_context/level-context';
import { Button } from '@/app/_components/ui/button';

export function LevelsPrimaryButtons() {
  const { setOpen } = useLevelContext();
  return (
    <div className="flex gap-2">
      <Button className="space-x-1" onClick={() => setOpen('add')}>
        <span>Add Level</span> <StepForward size={18} />
      </Button>
    </div>
  );
}
