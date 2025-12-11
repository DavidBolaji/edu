'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '@/app/_components/ui/button';
import { DownloadIcon, Store } from 'lucide-react';
import Spinner from '@/app/_components/ui/spinner';
import { getMetadata, saveMetadata } from '@/app/_lib/indexed-db';
import { createOffline } from '../../../action';

const CACHE_NAME = 'media-cache-v5';

interface DownloadButtonProps {
  mediaUrl: string;
  fileName: string;
  type: string;
  size: number;
  courseTitle: string;
  levelName: string;
  createdAt: string; // ISO string preferred
  title: string;
  name: string;
  mediaId: string;
  educatorId: string;
}

const DownloadButton = ({
  mediaUrl,
  fileName,
  type,
  size,
  courseTitle,
  levelName,
  createdAt,
  title,
  name,
  mediaId,
  educatorId,
}: DownloadButtonProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCached, setIsCached] = useState(false);

  useEffect(() => {
    const checkCacheStatus = async () => {
      const cache = await caches.open(CACHE_NAME);
      const response = await cache.match(mediaUrl);
      const metadata = await getMetadata(mediaUrl);
      setIsCached(!!response && !!metadata);
    };

    checkCacheStatus();
  }, [mediaUrl]);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await axios.get(mediaUrl, {
        responseType: 'blob',
      });

      const blob = response.data;

      // Cache the media file
      const resp = new Response(blob);
      const cache = await caches.open(CACHE_NAME);
      await cache.put(mediaUrl, resp);

      // Store metadata with all required fields including original URL
      const metadata = {
        id: mediaId,
        name: fileName,
        fileName,
        type: type.toUpperCase() as 'AUDIO' | 'VIDEO' | 'EBOOK', // Ensure proper enum value
        format: fileName.split('.').pop() || 'unknown',
        url: mediaUrl, // This will be used as the key for cache lookup
        originalUrl: mediaUrl, // Store original URL for fallback
        size,
        course: {
          title: courseTitle,
        },
        level: {
          name: levelName,
        },
        createdAt: new Date(createdAt),
        updatedAt: new Date(),
      };
     
      await saveMetadata(metadata);

      setIsCached(true);
      createOffline({ mediaId, educatorId });
    } catch (err) {
      console.error('Download failed:', err);
      alert('Download failed');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      className="px-2 text-xs rounded"
      onClick={handleDownload}
      disabled={isDownloading || isCached}
    >
      {isCached ? (
        <Store />
      ) : isDownloading ? (
        <Spinner color="white" />
      ) : (
        <DownloadIcon />
      )}
    </Button>
  );
};

export default DownloadButton;
