import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getLevelsName } from '../../../courses/[courseId]/action';

const useLevelName = () => {
  const { id } = useParams();
  const [levels, setLevels] = useState<
    { label: string; value: string }[] | null
  >(null);

  useEffect(() => {
    const fetchCourses = async () => {
      const req = await getLevelsName({ userId: id as string });
      const list = req.name?.map((el) => ({
        label: el,
        value: el,
      }));
      setLevels(list || []);
    };
    fetchCourses();
  }, []);

  return { levels };
};

export default useLevelName;
