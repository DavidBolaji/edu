"use client"

import { Button } from "@/app/_components/ui/button"
import { Slider } from "@/app/_components/ui/slider"
import { cn, formatTime } from "@/app/_lib/utils"
import { Pause, Play, Repeat, SkipBack, SkipForward, Download, ThumbsDown, ThumbsUp, Minimize } from "lucide-react"
import { useState } from "react"
import { useMediaContext } from "../_context/media-context"


interface MediaControlsProps {
  isPlaying: boolean
  isRepeating: boolean
  currentTime: number
  duration: number
  onPlayPause: () => void
  onRepeatToggle: () => void
  onDownload: () => void
  onSeek: (time: number) => void
   onNext?: () => void
  onPrevious?: () => void
  onFullscreen?: () => void
  className?: string
}

export function MediaControls({
  isPlaying,
  isRepeating,
  currentTime,
  duration,
  onPlayPause,
  onRepeatToggle,
  onDownload,
  onSeek,
  onNext,
  onPrevious,
  onFullscreen,
  className,
}: MediaControlsProps) {
  const { playlist, currentIndex, viewerType, setIsMinimized, setOpen } = useMediaContext()
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0
  const safeCurrent = Math.max(0, Math.min(currentTime, safeDuration))
  const [dragValue, setDragValue] = useState<number | null>(null)
  const display = dragValue ?? safeCurrent;

  console.log("PLAYLIST")
  console.log(playlist)

  const hasNext = playlist.length > 1
  const hasPrevious = playlist.length > 1

  const handleMinimize = () => {
    setIsMinimized(true)
    setOpen(null)
  }

  return (
    <div className={cn("flex w-full flex-col items-center gap-6", className)}>
      {/* {JSON.stringify(playlist)} */}
      {/* Action Row */}
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        <Button variant="ghost" size="icon" className="hover:bg-muted">
          <ThumbsUp className="h-5 w-5" />
          <span className="sr-only">Like</span>
        </Button>
        <Button variant="ghost" size="icon" className="hover:bg-muted">
          <ThumbsDown className="h-5 w-5" />
          <span className="sr-only">Dislike</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={onDownload} className="hover:bg-muted">
          <Download className="h-5 w-5" />
          <span className="sr-only">Download</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRepeatToggle}
          className={cn(
            "hover:bg-muted transition-colors",
            isRepeating && "bg-purple-500 text-white hover:bg-purple-600",
          )}
          aria-pressed={isRepeating}
          aria-label="Toggle repeat"
        >
          <Repeat className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleMinimize} className="hover:bg-muted">
          <Minimize className="h-5 w-5" />
          <span className="sr-only">Minimize</span>
        </Button>
      </div>

      {/* Transport */}
      <div className="flex items-center justify-center gap-4 sm:gap-6">
        <Button 
          variant="ghost"
          size="icon"
          className={cn("hover:bg-muted", !hasPrevious && "opacity-50")}
          onClick={onPrevious}
          disabled={!hasPrevious}
        >
          <SkipBack className="h-7 w-7" />
          <span className="sr-only">Previous</span>
        </Button>

        <Button
          size="icon"
          onClick={onPlayPause}
          className={cn(
            "rounded-full p-4 shadow-lg transition-colors",
            "bg-foreground text-background hover:bg-foreground/90",
          )}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
        </Button>

        <Button 
         variant="ghost"
          size="icon"
          className={cn("hover:bg-muted", !hasNext && "opacity-50")}
          onClick={onNext}
          disabled={!hasNext}
        >
          <SkipForward className="h-7 w-7" />
          <span className="sr-only">Next</span>
        </Button>
      </div>

      {/* Seekbar */}
      <div className="flex w-full flex-col gap-1">
        <Slider
          value={[display]}
          max={safeDuration || 1}
          min={0}
          step={0.1}
          onValueChange={(value) => {
            const t = value[0] ?? 0
            setDragValue(t)
            onSeek(t)
          }}
          onValueCommit={() => setDragValue(null)}
          className={cn(
            "w-full",
            // Subtle styling: thicker track, custom thumb
            "[&>span:first-child]:h-1.5 [&>span:first-child]:bg-muted [&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:bg-primary [&_[role=slider]]:border-0",
            "[&_[role=slider]:focus-visible]:ring-2 [&_[role=slider]:focus-visible]:ring-primary/40",
          )}
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={safeDuration}
          aria-valuenow={display}
          aria-valuetext={`${formatTime(display)} of ${formatTime(safeDuration)}`}
          disabled={safeDuration === 0}
        />
        <div className="flex w-full justify-between text-xs text-muted-foreground">
          <span>{formatTime(display)}</span>
          <span>{formatTime(safeDuration)}</span>
        </div>
      </div>
    </div>
  )
}
