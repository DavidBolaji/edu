import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { getCoursesTitle } from '../../../courses/action';

const useCourseTitle = () => {
  const { id } = useParams();
  const [courses, setCourses] = useState<
    { label: string; value: string }[] | null
  >(null);

  useEffect(() => {
    const fetchCourses = async () => {
      const req = await getCoursesTitle({ userId: id as string });
      const list = req.course?.map(({ title }) => ({
        label: title,
        value: title,
      }));
      setCourses(list || []);
    };
    fetchCourses();
  }, []);

  return { courses };
};

export default useCourseTitle;
