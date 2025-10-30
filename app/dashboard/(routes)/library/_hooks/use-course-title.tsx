'use client';

import { openDatabase } from '@/app/_lib/indexed-db';
import { useEffect, useState } from 'react';

const useCourseTitle = () => {
  const [courses, setCourses] = useState<
    { label: string; value: string }[] | null
  >(null);

  useEffect(() => {
    const fetchCoursesFromCache = async () => {
      const db = await openDatabase();
      const tx = db.transaction('mediaMetadata', 'readonly');
      const store = tx.objectStore('mediaMetadata');
      const request = store.getAll();

      request.onsuccess = () => {
        const metadata = request.result as any[];

        const uniqueCourses = Array.from(
          new Set(metadata.map((item) => item.courseTitle).filter(Boolean))
        );

        const formatted = uniqueCourses.map((title) => ({
          label: title,
          value: title,
        }));

        setCourses(formatted);
      };

      request.onerror = () => {
        console.error('Failed to load courses from cache');
        setCourses([]);
      };
    };

    fetchCoursesFromCache();
  }, []);

  return { courses };
};

export default useCourseTitle;
