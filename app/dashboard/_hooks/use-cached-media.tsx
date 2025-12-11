'use client';

import { useEffect, useState } from 'react';

const CACHE_NAME = 'media-cache-v5';

const useCachedMedia = () => {
  const [cachedMedia, setCachedMedia] = useState<string[]>([]);

  useEffect(() => {
    const fetchCachedMedia = async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        const cachedRequests = await cache.keys(); // Get all requests in cache
        const mediaUrls = cachedRequests.map((request) => request.url); // Extract URLs
        setCachedMedia(mediaUrls);
      } catch (error) {
        console.error('Error fetching cached media:', error);
      }
    };

    fetchCachedMedia();
  }, []);

  return { cachedMedia };
};

export default useCachedMedia;
