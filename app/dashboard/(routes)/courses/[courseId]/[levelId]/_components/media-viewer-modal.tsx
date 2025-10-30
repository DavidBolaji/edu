"use client"


import { Loader2, XIcon } from "lucide-react"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import { useMediaContext } from "../_context/media-context"
import { useMediaControls } from "../_hooks/use-media-controls"
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/app/_components/ui/dialog"
import { Button } from "@/app/_components/ui/button"
import { cn } from "@/app/_lib/utils"
import { MediaControls } from "./media-controls"
import { MiniPlayer } from "./media-mini-player"

export function MediaViewerModal() {
  const { currentRow, viewerType, open, setOpen, isMinimized } = useMediaContext()
  const [isLoading, setIsLoading] = useState(true)

  const {
    mediaRef, // Changed from mediaRef
    isPlaying,
    isRepeating,
    currentTime,
    duration,
    togglePlayPause,
    toggleRepeat,
    downloadMedia,
    seek,
    nextTrack,
    previousTrack,
    toggleFullscreen,
  } = useMediaControls()

  const isOpen = open === "viewer" && !!currentRow && !!viewerType

  // Reset loading whenever we switch items or open viewer
  useEffect(() => {
    if (isOpen) setIsLoading(true)
  }, [isOpen, currentRow?.id, viewerType])

  const handleMediaLoad = () => {
    setIsLoading(false)
  }

  const close = () => setOpen(null)

  const coverUrl = useMemo(() => {
    const anyRow = currentRow as any
    return anyRow?.coverUrl || anyRow?.imageUrl || anyRow?.thumbnailUrl || "/images/disk-placeholder.png"
  }, [currentRow])

  return (
    isMinimized ? <MiniPlayer /> : <Dialog open={isOpen} onOpenChange={(val) => !val && close()}>
      <DialogTitle className="hidden">{currentRow?.name ?? "Media Viewer"}</DialogTitle>
      <DialogContent className="w-full max-w-3xl overflow-hidden p-0">
        <div className="relative w-full bg-white">
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 z-20 bg-white text-muted-foreground hover:text-foreground"
            >
              <XIcon className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogClose>

          {/* Decorative header */}
          <div className="h-2 w-full bg-gradient-to-r from-purple-300 via-fuchsia-300 to-rose-300" />

          <div className="grid w-full gap-6 p-4 sm:p-6">
            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Ebook */}
            {viewerType === "ebook" && currentRow?.url && (
              <iframe
                src={currentRow.url}
                title="Ebook Viewer"
                width="100%"
                height={500}
                className="rounded border"
                sandbox="allow-scripts allow-same-origin"
                onLoad={handleMediaLoad}
              />
            )}

            {/* Audio / Video */}
            {(viewerType === "audio" || viewerType === "video") && currentRow?.url && (
              <>
                {viewerType === "audio" ? (
                  <audio
                    ref={mediaRef} // Changed from mediaRef
                    src={currentRow.url}
                    className="mt-2 w-full"
                    onLoadedMetadata={handleMediaLoad}
                    // Rely on our custom controls
                    controls={false}
                  />
                ) : (
                  <video
                    ref={mediaRef} // Changed from mediaRef
                    src={currentRow.url}
                    className="mt-2 max-h-[420px] w-full rounded"
                    onLoadedMetadata={handleMediaLoad}
                    controls={false}
                  />
                )}

                {/* Artwork */}
                <div className="mx-auto grid w-full place-items-center gap-4">
                  <div
                    className={cn(
                      "relative h-36 w-36 overflow-hidden rounded-full bg-gradient-to-br from-purple-100 to-rose-100 shadow",
                      isPlaying && "animate-spin",
                    )}
                    aria-hidden
                  >
                    <Image
                      src={coverUrl || "/placeholder.svg"}
                      alt="Album art"
                      fill
                      sizes="144px"
                      className="object-cover"
                    />
                  </div>

                  {/* Track meta */}
                  <div className="flex flex-col items-center gap-1 text-center">
                    <h2 className="line-clamp-1 text-lg font-semibold">{currentRow?.name || "Unknown Title"}</h2>
                    <p className="text-sm text-muted-foreground">Unknown Album</p>
                    <p className="text-xs text-muted-foreground">
                      {currentRow?.createdAt
                        ? format(
                          typeof currentRow.createdAt === "string"
                            ? new Date(currentRow.createdAt)
                            : (currentRow.createdAt as Date),
                          "do MMM",
                        )
                        : "Unknown Year"}
                    </p>
                  </div>
                </div>

                {/* Controls */}
                <MediaControls
                  isPlaying={isPlaying}
                  isRepeating={isRepeating}
                  currentTime={currentTime}
                  duration={duration}
                  onPlayPause={togglePlayPause}
                  onRepeatToggle={toggleRepeat}
                  onDownload={() => downloadMedia(currentRow.url, currentRow.name)}
                  onSeek={seek}
                  onNext={nextTrack}
                  onPrevious={previousTrack}
                  onFullscreen={toggleFullscreen}
                  className="pt-2"
                />
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
