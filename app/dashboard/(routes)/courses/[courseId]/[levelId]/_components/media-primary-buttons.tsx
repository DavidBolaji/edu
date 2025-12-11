'use client';

import { ListMusic } from 'lucide-react';
import { useMediaDialogContext } from '../_context/media-dialog-context';
import { Button } from '@/app/_components/ui/button';

export function MediasPrimaryButtons() {
  const { setOpen } = useMediaDialogContext();
  return (
    <div className="flex gap-2">
      <Button className="space-x-1" onClick={() => setOpen('add')}>
        <span>Add Media</span> <ListMusic size={18} />
      </Button>
    </div>
  );
}
