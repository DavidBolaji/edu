'use client';

import { FolderPlus } from 'lucide-react';
import { useCourseContext } from '../_context/courses-context';
import { Button } from '@/app/_components/ui/button';

export function CoursesPrimaryButtons() {
  const { setOpen } = useCourseContext();
  return (
    <div className="flex gap-2">
      <Button className="space-x-1" onClick={() => setOpen('add')}>
        <span>Add Course</span> <FolderPlus size={18} />
      </Button>
    </div>
  );
}
