import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import { Row } from '@tanstack/react-table';
import { UserMedia } from '../../_data/schema';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/app/_components/ui/dropdown-menu';
import { Button } from '@/app/_components/ui/button';
import { ViewIcon } from 'lucide-react';
import { useMediaPlayer } from '@/app/_contexts/media-player-provider';
import { updateViewed } from '../../action';
import { MediaType } from '@/src/entities/models/media';

interface DataTableRowActionsProps {
  row: Row<UserMedia>;
  allMedia?: UserMedia[];
}

export function UserMediaTableRowActions({ row, allMedia = [] }: DataTableRowActionsProps) {
  const { loadMedia, loadPlaylist, play } = useMediaPlayer();

  // Convert UserMedia to MediaItem format
  const convertToMediaItem = (media: UserMedia) => ({
    id: media.id,
    name: media.name,
    type: media.type as MediaType, // Direct cast since it's already the correct type
    url: media.url,
    size: media.size,
    format: media.format,
    courseId: '', // User media doesn't have courseId
    levelId: '', // User media doesn't have levelId
    userId: '', // User media doesn't have userId in this context
    createdAt: media.createdAt,
    updatedAt: media.updatedAt,
  });

  const handlePlayUserMedia = async () => {
    const media = row.original;
    const mediaItem = convertToMediaItem(media);
    
    // If we have multiple media items, load as playlist
    if (allMedia.length > 1) {
      const playlist = allMedia.map(convertToMediaItem);
      const currentIndex = allMedia.findIndex(m => m.id === media.id);
      await loadPlaylist(playlist, currentIndex >= 0 ? currentIndex : 0);
    } else {
      // Single media item
      await loadMedia(mediaItem);
    }
    
    // Start playback
    await play();
    
    // Update viewed status
    updateViewed({ mediaId: media.id });
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
          <DropdownMenuItem
            onClick={handlePlayUserMedia}
            className="text-red-500!"
          >
            View
            <DropdownMenuShortcut>
              <ViewIcon size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
