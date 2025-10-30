"use client"

import { useEffect, useState, useCallback } from "react"
import { useMediaContext } from "../_context/media-context"


export function useMediaControls() {
  // Use a state to hold the media element reference
  const [mediaElement, setMediaElement] = useState<HTMLAudioElement | HTMLVideoElement | null>(null)
  const {
    currentRow,
    viewerType,
    open,
    playlist,
    currentIndex,
    setCurrentIndex,
    setCurrentRow,
    isFullscreen,
    setIsFullscreen,

  } = useMediaContext()


  const [isPlaying, setIsPlaying] = useState(false)
  const [isRepeating, setIsRepeating] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    if (!currentRow?.url || !viewerType || (viewerType !== "audio" && viewerType !== "video")) {
      return
    }

    // Create or reuse existing media element
    let element = mediaElement

    if (!element || element.tagName.toLowerCase() !== viewerType) {
      // Clean up old element if it exists
      if (element) {
        element.pause()
        element.remove()
      }

      // Create new element
      element = viewerType === "audio" ? document.createElement("audio") : document.createElement("video")

      // Hide the element since it's just for playback control
      element.style.display = "none"
      document.body.appendChild(element)

      setMediaElement(element)
    }

    // Update source if it changed
    if (element.src !== currentRow.url) {
      element.src = currentRow.url
      element.load()
    }

    return () => {
      // Don't remove element on cleanup - keep it persistent
    }
  }, [currentRow?.url, viewerType])

  // Callback ref for visible media elements (in modal)
  const mediaRef = useCallback(
    (node: HTMLAudioElement | HTMLVideoElement | null) => {
      if (node && mediaElement) {
        // Sync the visible element with our persistent element
        node.src = mediaElement.src
        node.currentTime = mediaElement.currentTime
        if (!mediaElement.paused) {
          node.play().catch(console.error)
        }

        // Keep them in sync
        const syncFromVisible = () => {
          if (mediaElement) {
            mediaElement.currentTime = node.currentTime
          }
        }

        const syncFromPersistent = () => {
          if (Math.abs(node.currentTime - mediaElement.currentTime) > 0.5) {
            node.currentTime = mediaElement.currentTime
          }
          if (mediaElement.paused !== node.paused) {
            if (mediaElement.paused) {
              node.pause()
            } else {
              node.play().catch(console.error)
            }
          }
        }

        node.addEventListener("timeupdate", syncFromVisible)
        node.addEventListener("seeked", syncFromVisible)

        const interval = setInterval(syncFromPersistent, 100)

        return () => {
          node.removeEventListener("timeupdate", syncFromVisible)
          node.removeEventListener("seeked", syncFromVisible)
          clearInterval(interval)
        }
      }
    },
    [mediaElement],
  )

  const nextTrack = useCallback(() => {
    if (playlist.length <= 1) return

    const nextIndex = currentIndex >= playlist.length - 1 ? 0 : currentIndex + 1
    const nextMedia = playlist[nextIndex]
    if (nextMedia) {
      setCurrentIndex(nextIndex)
      setCurrentRow(nextMedia)
    }
  }, [playlist, currentIndex, setCurrentIndex, setCurrentRow])

  const previousTrack = useCallback(() => {
    if (playlist.length <= 1) return

    const prevIndex = currentIndex <= 0 ? playlist.length - 1 : currentIndex - 1
    const prevMedia = playlist[prevIndex]
    if (prevMedia) {
      setCurrentIndex(prevIndex)
      setCurrentRow(prevMedia)
    }
  }, [playlist, currentIndex, setCurrentIndex, setCurrentRow])

  const toggleFullscreen = useCallback(() => {
    if (!mediaElement || viewerType !== "video") return

    if (!document.fullscreenElement) {
      mediaElement.requestFullscreen?.()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen?.()
      setIsFullscreen(false)
    }
  }, [mediaElement, viewerType, setIsFullscreen])

  // Play / Pause toggle
  const togglePlayPause = async () => {
    if (!mediaElement) return
    if (mediaElement.paused) {
      try {
        await mediaElement.play()
        setIsPlaying(true)
      } catch (error) {
        console.error("Error playing media:", error)
      }
    } else {
      mediaElement.pause()
      setIsPlaying(false)
    }
  }

  // Repeat toggle
  const toggleRepeat = () => {
    if (!mediaElement) return
    mediaElement.loop = !mediaElement.loop
    setIsRepeating(mediaElement.loop)
  }

  const downloadMedia = (url: string, filename: string) => {
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.rel = "noopener"
    a.click()
  }

  // Seek to a time (clamped)
  const seek = (time: number) => {
    if (!mediaElement) return
    const dur = Number.isFinite(mediaElement.duration) ? mediaElement.duration : duration
    const clamped = Math.max(0, Math.min(time, dur || 0))
    mediaElement.currentTime = clamped
    setCurrentTime(clamped) // Update UI immediately
  }

  // Attach listeners when mediaElement becomes available
  useEffect(() => {
    if (!mediaElement) return

    const setDur = () => setDuration(Number.isFinite(mediaElement.duration) ? mediaElement.duration : 0)
    const setTime = () => setCurrentTime(mediaElement.currentTime)
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onEnded = () => {
      setIsPlaying(false)
      // Auto-play next track if available
      if (playlist.length > 1 && currentIndex < playlist.length - 1) {
        nextTrack()
      }
    }

    mediaElement.addEventListener("loadedmetadata", setDur)
    mediaElement.addEventListener("durationchange", setDur)
    mediaElement.addEventListener("timeupdate", setTime)
    mediaElement.addEventListener("play", onPlay)
    mediaElement.addEventListener("pause", onPause)
    mediaElement.addEventListener("ended", onEnded)

    // Initialize state from element
    setDur()
    setTime()
    setIsPlaying(!mediaElement.paused)
    setIsRepeating(mediaElement.loop)

    return () => {
      mediaElement.removeEventListener("loadedmetadata", setDur)
      mediaElement.removeEventListener("durationchange", setDur)
      mediaElement.removeEventListener("timeupdate", setTime)
      mediaElement.removeEventListener("play", onPlay)
      mediaElement.removeEventListener("pause", onPause)
      mediaElement.removeEventListener("ended", onEnded)
    }
  }, [mediaElement, nextTrack, playlist.length, currentIndex])

  // Reset state when the current media item changes
  useEffect(() => {
    setCurrentTime(0)
    setDuration(0)
    setIsPlaying(false)
    // If mediaElement exists, pause it when the source changes
    if (mediaElement) {
      mediaElement.pause()
    }
  }, [currentRow?.url, mediaElement])

  useEffect(() => {
    return () => {
      if (mediaElement) {
        mediaElement.pause()
        mediaElement.remove()
      }
    }
  }, [])

  return {
    mediaRef, // Expose the callback ref for visible elements
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
  }
}
