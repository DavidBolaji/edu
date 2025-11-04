'use client';

import { cn } from '@/app/_lib/utils';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from '@/app/_components/ui/dialog';
import { Loader2, XIcon } from 'lucide-react';
import { useState } from 'react';

import Image from 'next/image';
import { format } from 'date-fns';
import { useOfflineContext } from '../_context/offline-context';
import { useMediaControls } from '../../courses/[courseId]/[levelId]/_hooks/use-media-controls';
import { MediaControls } from '../../courses/[courseId]/[levelId]/_components/media-controls';

export function OfflineViewerModal() {
  const { currentRow, viewerType, open, setOpen, currentBlobUrl } =
    useOfflineContext();
  const [isLoading, setIsLoading] = useState(true);
  const {
    mediaRef,
    isPlaying,
    isRepeating,
    currentTime,
    duration,
    togglePlayPause,
    toggleRepeat,
    downloadMedia,
    seek,
  } = useMediaControls();

  const isOpen = open === 'viewer' && !!currentRow && !!viewerType;

  const handleMediaLoad = () => {
    setIsLoading(false);
  };

  const close = () => {
    if (viewerType === "audio") {
      togglePlayPause();
    }
    setOpen(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && close()}>
      <DialogTitle className="hidden">{currentRow?.fileName}</DialogTitle>
      <DialogContent className="max-w-3xl w-full p-0 overflow-scroll">
        <div className="relative bg-white rounded-lg w-full h-full p-4">
          <DialogClose className="absolute top-2 w-12 h-12 bg-white right-2 p-2 text-muted-foreground hover:text-foreground">
            {/* <XIcon className="h-4 w-4" /> */}
          </DialogClose>

          {/* Spinner */}
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {viewerType === 'ebook' && (
            <iframe
              src={currentBlobUrl as string}
              title="Ebook Viewer"
              width="100%"
              height="500"
              className="rounded border"
              onLoad={handleMediaLoad}
            />
          )}

          {/* Audio/Video */}
          {(viewerType === 'audio' || viewerType === 'video') && (
            <>
              {viewerType === 'audio' ? (
                <>
                  <audio
                    ref={mediaRef}
                    src={currentRow!.url}
                    className="w-full mt-4"
                    onLoadedMetadata={handleMediaLoad}
                  />
                  {/* Album Art */}
                  <div
                    className={cn(
                      'w-1/4 rounded-full bg-primary mx-auto overflow-hidden',
                      {
                        isPlaying: 'animate-spin',
                      }
                    )}
                  >
                    <Image
                      src={'/images/disc.png'}
                      alt="Album Art"
                      width={300}
                      height={300}
                      className="object-cover w-full h-full"
                    />
                  </div>

                  {/* Track Info */}
                  <div className="flex flex-col items-center gap-1">
                    <h2 className="text-lg font-semibold">
                      {currentRow?.fileName || 'Unknown Title'}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {'Unknown Album'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(
                        currentRow!.createdAt as unknown as string,
                        'do MMM'
                      ) || 'Unknown Year'}
                    </p>
                  </div>

                  <MediaControls
                    isPlaying={isPlaying}
                    isRepeating={isRepeating}
                    currentTime={currentTime}
                    duration={duration}
                    onPlayPause={togglePlayPause}
                    onRepeatToggle={toggleRepeat}
                    onDownload={() =>
                      downloadMedia(currentRow!.url, currentRow!.name)
                    }
                    onSeek={seek}
                  />
                </>
              ) : (
                <video
                  ref={mediaRef}
                  src={currentRow!.url}
                  // className="w-full mt-4 max-h-[400px] rounded"
                  onLoadedMetadata={handleMediaLoad}
                  controls={true}
                />
              )}




            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
