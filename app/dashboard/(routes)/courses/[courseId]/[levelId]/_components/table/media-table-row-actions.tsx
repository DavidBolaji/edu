'use client';

import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import { Row } from '@tanstack/react-table';
import { Media } from '../../_data/schema';
import { useMediaPlayer } from '@/app/_contexts/media-player-provider';
import { MediaItem, MediaType } from '@/src/entities/models/media';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/app/_components/ui/dropdown-menu';
import { Button } from '@/app/_components/ui/button';
import { Edit, Trash2, ViewIcon } from 'lucide-react';
import { useParams } from 'next/navigation';

interface DataTableRowActionsProps {
  row: Row<Media>;
  allMedia?: Media[];
}

export function MediaTableRowActions({ row, allMedia = [] }: DataTableRowActionsProps) {
  const { loadMedia, loadPlaylist, play } = useMediaPlayer();
  const params = useParams();
  
  // Convert Media to MediaItem format
  const convertToMediaItem = (media: Media): MediaItem => ({
    id: media.id,
    name: media.name,
    type: media.type as MediaType,
    url: media.url,
    size: media.size,
    format: media.format,
    courseId: params.courseId as string,
    levelId: params.levelId as string,
    userId: '', // Will be populated by the backend
    createdAt: media.createdAt,
    updatedAt: media.updatedAt,
  });
  
  const handlePlayMedia = async () => {
    const mediaItem = convertToMediaItem(row.original);
    
    // If we have multiple media items, load as playlist
    if (allMedia.length > 1) {
      const playlist = allMedia.map(convertToMediaItem);
      const currentIndex = allMedia.findIndex(m => m.id === row.original.id);
      await loadPlaylist(playlist, currentIndex >= 0 ? currentIndex : 0);
    } else {
      // Single media item
      await loadMedia(mediaItem);
    }
    
    // Start playback
    await play();
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
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem onClick={handlePlayMedia}>
            Play
            <DropdownMenuShortcut>
              <ViewIcon size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            Edit
            <DropdownMenuShortcut>
              <Edit size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-500!">
            Delete
            <DropdownMenuShortcut>
              <Trash2 size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
