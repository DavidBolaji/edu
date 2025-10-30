'use client';

import { openDatabase } from '@/app/_lib/indexed-db';
import { useEffect, useState } from 'react';

const useLevelName = () => {
  const [levels, setLevels] = useState<
    { label: string; value: string }[] | null
  >(null);

  useEffect(() => {
    const fetchLevelsFromCache = async () => {
      const db = await openDatabase();
      const tx = db.transaction('mediaMetadata', 'readonly');
      const store = tx.objectStore('mediaMetadata');
      const request = store.getAll();

      request.onsuccess = () => {
        const metadata = request.result as any[];

        const uniqueLevels = Array.from(
          new Set(metadata.map((item) => item.levelName).filter(Boolean))
        );

        const formatted = uniqueLevels.map((name) => ({
          label: name,
          value: name,
        }));

        setLevels(formatted);
      };

      request.onerror = () => {
        console.error('Failed to load levels from cache');
        setLevels([]);
      };
    };

    fetchLevelsFromCache();
  }, []);

  return { levels };
};

export default useLevelName;
