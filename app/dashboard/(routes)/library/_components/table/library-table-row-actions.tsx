'use client';

import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import { Row } from '@tanstack/react-table';
import { OfflineMedia } from '../../_data/schema';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/app/_components/ui/dropdown-menu';
import { Button } from '@/app/_components/ui/button';
import { ViewIcon, Trash2 } from 'lucide-react';
import { useMediaPlayer } from '@/app/_contexts/media-player-provider';
import { convertOfflineMediaToMediaItem, validateCachedMedia } from '@/app/_lib/offline-media-utils';
import { updateViewed } from '../../../home/[id]/action';
import { toast } from 'sonner';
import { openDatabase } from '@/app/_lib/indexed-db';
import { useState } from 'react';

interface DataTableRowActionsProps {
  row: Row<OfflineMedia>;
  allMedia?: OfflineMedia[];
  onCacheCleared?: () => void;
}

export function LibraryTableRowActions({ row, allMedia = [], onCacheCleared }: DataTableRowActionsProps) {
  const { loadMedia, loadPlaylist, play } = useMediaPlayer();
  const [isDeleting, setIsDeleting] = useState(false);

  const handlePlayOfflineMedia = async () => {
    try {
      const offlineMedia = row.original;
      
      // Validate that required fields exist
      if (!offlineMedia.id || !offlineMedia.url || !offlineMedia.type) {
        toast.error('Media data is incomplete. Please download it again.');
        return;
      }

      // Validate cache before attempting to play
      const validation = await validateCachedMedia(offlineMedia.url, offlineMedia.size);

      if (!validation.isValid) {
        // Display appropriate error message
        toast.error(validation.message || 'Failed to load offline media');
        
        if (!validation.exists) {
          toast.info('Please download this media to play it offline.');
        } else if (validation.isCorrupted) {
          toast.info('Try downloading the media again.');
        }
        
        return;
      }

      // Convert offline media to MediaItem format with blob URL
      const mediaItem = await convertOfflineMediaToMediaItem(offlineMedia);

      // If we have multiple media items, load as playlist
      if (allMedia.length > 1) {
        // Validate and convert all media items for playlist
        const validMediaItems = [];
        
        for (const media of allMedia) {
          try {
            const validation = await validateCachedMedia(media.url, media.size);
            if (validation.isValid) {
              const convertedMedia = await convertOfflineMediaToMediaItem(media);
              validMediaItems.push(convertedMedia);
            }
          } catch (error) {
            console.warn(`Skipping invalid media: ${media.fileName}`, error);
          }
        }
        
        if (validMediaItems.length > 1) {
          const currentIndex = validMediaItems.findIndex(m => m.id === mediaItem.id);
          await loadPlaylist(validMediaItems, currentIndex >= 0 ? currentIndex : 0);
        } else {
          // Fallback to single media if playlist validation failed
          await loadMedia(mediaItem);
        }
      } else {
        // Single media item
        await loadMedia(mediaItem);
      }

      // Start playback
      await play();

      // Update viewed status
      updateViewed({ mediaId: offlineMedia.id });

    } catch (error) {
      console.error('[LibraryTableRowActions] Failed to play offline media:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to load offline media. Please try again.';
      
      toast.error(errorMessage);
    }
  };

  const handleClearFromCache = async () => {
    if (isDeleting) return;
    
    try {
      setIsDeleting(true);
      const offlineMedia = row.original;
      
      // Open cache and IndexedDB
      const cache = await caches.open('media-cache-v5');
      const db = await openDatabase();
      
      // Remove from cache
      const cacheDeleted = await cache.delete(offlineMedia.url);
      
      // Remove metadata from IndexedDB
      const tx = db.transaction('mediaMetadata', 'readwrite');
      const store = tx.objectStore('mediaMetadata');
      await store.delete(offlineMedia.id);
      
      if (cacheDeleted) {
        toast.success('Media removed from cache', {
          description: `${offlineMedia.fileName} has been cleared from offline storage.`
        });
        
        // Trigger refresh of the table data
        if (onCacheCleared) {
          onCacheCleared();
        } else {
          // Fallback: reload the page
          window.location.reload();
        }
      } else {
        toast.warning('Media not found in cache', {
          description: 'The media may have already been removed.'
        });
      }
      
    } catch (error) {
      console.error('[LibraryTableRowActions] Failed to clear cache:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to clear media from cache. Please try again.';
      
      toast.error('Failed to clear cache', {
        description: errorMessage
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted flex h-8 w-8 p-0"
          >
            <DotsHorizontalIcon className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[180px]">
          <DropdownMenuItem onClick={handlePlayOfflineMedia}>
            View
            <DropdownMenuShortcut>
              <ViewIcon size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleClearFromCache}
            disabled={isDeleting}
            className="text-red-600 focus:text-red-600"
          >
            {isDeleting ? 'Clearing...' : 'Clear from Cache'}
            <DropdownMenuShortcut>
              <Trash2 size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
