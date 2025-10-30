"use client"


import { Play, Pause, SkipBack, SkipForward, X, Maximize2 } from "lucide-react"

import Image from "next/image"
import { useMemo } from "react"
import { useMediaContext } from "../_context/media-context"
import { useMediaControls } from "../_hooks/use-media-controls"
import { cn } from "@/app/_lib/utils"
import { Button } from "@/app/_components/ui/button"

export function MiniPlayer() {
    const { currentRow, isMinimized, setIsMinimized, setOpen, playlist, currentIndex } = useMediaContext()
    const { isPlaying, togglePlayPause, nextTrack, previousTrack } = useMediaControls()

    const coverUrl = useMemo(() => {
        const anyRow = currentRow as any
        return anyRow?.coverUrl || anyRow?.imageUrl || anyRow?.thumbnailUrl || "/placeholder.svg?height=48&width=48"
    }, [currentRow])

    if (!isMinimized || !currentRow) return null

    const hasNext = playlist.length > 1 && currentIndex < playlist.length - 1
    const hasPrevious = playlist.length > 1 && currentIndex > 0

    const expandPlayer = () => {
        setIsMinimized(false)
        setOpen("viewer")
    }

    const closePlayer = () => {
        setIsMinimized(false)
    }

    return (
        <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 w-80">
            <div className="flex items-center gap-3">
                {/* Album Art */}
                <div
                    className={cn(
                        "w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0",
                        isPlaying && "animate-spin",
                    )}
                >
                    <Image
                        src={coverUrl || "/placeholder.svg"}
                        alt="Album Art"
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                    />
                </div>

                {/* Track Info */}
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate">{currentRow.name || "Unknown Title"}</h4>
                    <p className="text-xs text-muted-foreground truncate">Unknown Artist</p>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={previousTrack}
                        disabled={!hasPrevious}
                        className={cn("h-8 w-8 p-0", !hasPrevious && "opacity-50")}
                    >
                        <SkipBack className="h-4 w-4" />
                    </Button>

                    <Button variant="ghost" size="sm" onClick={togglePlayPause} className="h-8 w-8 p-0">
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={nextTrack}
                        disabled={!hasNext}
                        className={cn("h-8 w-8 p-0", !hasNext && "opacity-50")}
                    >
                        <SkipForward className="h-4 w-4" />
                    </Button>

                    <Button variant="ghost" size="sm" onClick={expandPlayer} className="h-8 w-8 p-0">
                        <Maximize2 className="h-4 w-4" />
                    </Button>

                    <Button variant="ghost" size="sm" onClick={closePlayer} className="h-8 w-8 p-0">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
