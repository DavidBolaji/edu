'use client';

import { createContext, PropsWithChildren, useContext, useState } from 'react';
import { Course } from '../_data/schema';

type CoursesDialogType = 'add' | 'edit' | 'delete';

interface CoursesContextType {
  open: CoursesDialogType | null;
  setOpen: (str: CoursesDialogType | null) => void;
  currentRow: Course | null;
  setCurrentRow: React.Dispatch<React.SetStateAction<Course | null>>;
}

const CourseContext = createContext<CoursesContextType | null>(null);

export const CourseContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [open, setOpen] = useState<CoursesDialogType | null>(null);
  const [currentRow, setCurrentRow] = useState<Course | null>(null);

  const values = {
    open,
    setOpen,
    currentRow,
    setCurrentRow,
  };
  return (
    <CourseContext.Provider value={values}>{children}</CourseContext.Provider>
  );
};

export const useCourseContext = () => {
  const coursesContext = useContext(CourseContext);
  if (!coursesContext) {
    throw new Error('useCourses has to be used within <CoursesContext>');
  }

  return coursesContext;
};
