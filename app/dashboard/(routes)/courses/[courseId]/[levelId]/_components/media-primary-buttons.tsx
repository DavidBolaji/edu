'use client';

import { ListMusic } from 'lucide-react';
import { useMediaContext } from '../_context/media-context';
import { Button } from '@/app/_components/ui/button';

export function MediasPrimaryButtons() {
  const { setOpen } = useMediaContext();
  return (
    <div className="flex gap-2">
      <Button className="space-x-1" onClick={() => setOpen('add')}>
        <span>Add Media</span> <ListMusic size={18} />
      </Button>
    </div>
  );
}
