'use client';

import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react';
import { OfflineMedia } from '../_data/schema';
import { openDatabase } from '@/app/_lib/indexed-db';

const CACHE_NAME = 'media-cache-v1';

type ViewerType = 'audio' | 'video' | 'ebook' | null;
type OfflineDialogType = 'viewer';

interface OfflineContextType {
  open: OfflineDialogType | null;
  setOpen: (str: OfflineDialogType | null) => void;
  currentRow: OfflineMedia | null;
  setCurrentRow: React.Dispatch<React.SetStateAction<OfflineMedia | null>>;
  currentBlobUrl: string | null;
  cachedMedia: OfflineMedia[];
  viewerType: ViewerType;
  setViewerType: (type: ViewerType) => void;
}

const OfflineContext = createContext<OfflineContextType | null>(null);

export const OfflineContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [open, setOpen] = useState<OfflineDialogType | null>(null);
  const [currentRow, setCurrentRow] = useState<OfflineMedia | null>(null);
  const [cachedMedia, setCachedMedia] = useState<OfflineMedia[]>([]);
  const [viewerType, setViewerType] = useState<ViewerType>(null);
  const [currentBlobUrl, setCurrentBlobUrl] = useState<string | null>(null);

  // Fetch all cached metadata + validate blobs
  useEffect(() => {
    const fetchCachedMedia = async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        const db = await openDatabase();
        const tx = db.transaction('mediaMetadata', 'readonly');
        const store = tx.objectStore('mediaMetadata');
        const request = store.getAll();

        request.onsuccess = async () => {
          const allMetadata = request.result as OfflineMedia[];

          const validCached: OfflineMedia[] = [];
          for (const metadata of allMetadata) {
            const response = await cache.match(metadata.url);
            if (response) {
              validCached.push(metadata);
            }
          }

          setCachedMedia(validCached);
        };

        request.onerror = () => {
          console.error('Failed to get metadata from IndexedDB');
        };
      } catch (error) {
        console.error('Error fetching cached media:', error);
      }
    };

    fetchCachedMedia();
  }, []);

  // Update blob URL when currentRow changes
  useEffect(() => {
    const getBlobFromCache = async () => {
      if (!currentRow?.url) {
        setCurrentBlobUrl(null);
        return;
      }

      try {
        const cache = await caches.open(CACHE_NAME);
        const response = await cache.match(currentRow.url);
        if (!response) {
          setCurrentBlobUrl(null);
          return;
        }

      

        const blob = await response.blob();
     
        const blobUrl = URL.createObjectURL(blob);
      
        setCurrentBlobUrl(blobUrl);
      } catch (error) {
        console.error('Failed to load blob for currentRow:', error);
        setCurrentBlobUrl(null);
      }
    };

    getBlobFromCache();

    return () => {
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
        setCurrentBlobUrl(null);
      }
    };
  }, [currentRow]);

  const values = {
    open,
    setOpen,
    currentRow,
    setCurrentRow,
    currentBlobUrl,
    cachedMedia,
    viewerType,
    setViewerType,
  };

  return (
    <OfflineContext.Provider value={values}>{children}</OfflineContext.Provider>
  );
};

export const useOfflineContext = () => {
  const offlineContext = useContext(OfflineContext);
  if (!offlineContext) {
    throw new Error(
      'useOfflineContext has to be used within <OfflineContextProvider>'
    );
  }

  return offlineContext;
};
