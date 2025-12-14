'use client';

import { useCourseContext } from '../_context/courses-context';
import CourseActionDialog from './course-action-dialogs';
import { CoursesDeleteDialog } from './course-delete-dialog';

export function CoursesDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useCourseContext();
  return (
    <>
      <CourseActionDialog
        key="course-add"
        open={open === 'add'}
        onOpenChange={() => setOpen(null)}
      />

      {currentRow && (
        <>
          <CourseActionDialog
            key={`course-edit-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={() => {
              setOpen(null);
              setCurrentRow(null);
            }}
            currentRow={currentRow}
          />

          <CoursesDeleteDialog
            key={`course-delete-${currentRow.id}`}
            open={open === 'delete'}
            onOpenChange={() => {
              setOpen(null);
              setCurrentRow(null);
            }}
            currentRow={currentRow}
          />
        </>
      )}
    </>
  );
}
