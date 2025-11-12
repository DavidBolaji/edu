"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useMediaContext } from "../_context/media-context"
import { AudioManagerService } from "@/src/application/services/audio-manager.service"

export function useMediaControls() {
  // Use a ref to hold the current visible media element reference
  const visibleMediaRef = useRef<HTMLAudioElement | HTMLVideoElement | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)
  const audioManager = useRef<AudioManagerService | null>(null)
  
  const {
    currentRow,
    viewerType,
    playlist,
    currentIndex,
    setCurrentIndex,
    setCurrentRow,
    setIsFullscreen,
  } = useMediaContext()

  const [isPlaying, setIsPlaying] = useState(false)
  const [isRepeating, setIsRepeating] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // Initialize audio manager
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioManager.current = AudioManagerService.getInstance()
    }
  }, [])

  // Get the active media element based on type
  const getActiveMediaElement = useCallback(() => {
    if (viewerType === "audio" && audioManager.current) {
      return audioManager.current.getGlobalAudioElement()
    } else if (viewerType === "video") {
      return visibleMediaRef.current
    }
    return null
  }, [viewerType])

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
    const activeElement = getActiveMediaElement()
    if (!activeElement || viewerType !== "video") return

    if (!document.fullscreenElement) {
      activeElement.requestFullscreen?.()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen?.()
      setIsFullscreen(false)
    }
  }, [getActiveMediaElement, viewerType, setIsFullscreen])

  // Create or update media element when needed
  useEffect(() => {
    if (!currentRow?.url || !viewerType || (viewerType !== "audio" && viewerType !== "video")) {
      return
    }

    if (viewerType === "audio" && audioManager.current) {
      // Get or create the global audio element (this also prevents duplicates)
      const globalAudio = audioManager.current.createAudioElement()
      
      // Pause before changing source to prevent overlap
      if (!globalAudio.paused) {
        globalAudio.pause()
      }
      
      // Update source if different
      const fullUrl = currentRow.url.startsWith('http') ? currentRow.url : currentRow.url
      if (globalAudio.src !== fullUrl) {
        globalAudio.src = fullUrl
        globalAudio.load()
      }
      
      // Final check to ensure no duplicates
      audioManager.current.preventDuplicateStreams()
    }

    return () => {
      // Cleanup will be handled by the audio manager
    }
  }, [currentRow?.url, viewerType])

  // Callback ref for visible media elements (in modal)
  const mediaRef = useCallback(
    (node: HTMLAudioElement | HTMLVideoElement | null) => {
      // Clean up previous visible element
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }

      visibleMediaRef.current = node

      if (!node) return

      // Only handle video elements - audio is managed by AudioManager
      if (viewerType === "video") {
        // For video: Use the visible element directly
        if (currentRow?.url && node.src !== currentRow.url) {
          node.src = currentRow.url
          node.load()
        }
        
        const cleanup = () => {
          node.pause()
          node.src = ''
          node.load()
        }
        
        cleanupRef.current = cleanup
      }
    },
    [viewerType, currentRow?.url],
  )

  // Play / Pause toggle
  const togglePlayPause = async () => {
    const activeElement = getActiveMediaElement()
    if (!activeElement) return

    if (activeElement.paused) {
      try {
        // For audio: ensure no duplicates and resume audio context
        if (audioManager.current && viewerType === "audio") {
          audioManager.current.preventDuplicateStreams()
          await audioManager.current.resumeAudioContext()
        }
        
        await activeElement.play()
        setIsPlaying(true)
      } catch (error) {
        console.error("Error playing media:", error)
      }
    } else {
      activeElement.pause()
      setIsPlaying(false)
    }
  }

  // Repeat toggle
  const toggleRepeat = () => {
    const activeElement = getActiveMediaElement()
    if (!activeElement) return
    activeElement.loop = !activeElement.loop
    setIsRepeating(activeElement.loop)
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
    const activeElement = getActiveMediaElement()
    if (!activeElement) return
    const dur = Number.isFinite(activeElement.duration) ? activeElement.duration : duration
    const clamped = Math.max(0, Math.min(time, dur || 0))
    activeElement.currentTime = clamped
    setCurrentTime(clamped) // Update UI immediately
  }

  // Attach listeners when active media element becomes available
  useEffect(() => {
    const activeElement = getActiveMediaElement()
    if (!activeElement) return

    const setDur = () => setDuration(Number.isFinite(activeElement.duration) ? activeElement.duration : 0)
    const setTime = () => setCurrentTime(activeElement.currentTime)
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onEnded = () => {
      setIsPlaying(false)
      // Auto-play next track if available
      if (playlist.length > 1 && currentIndex < playlist.length - 1) {
        nextTrack()
      }
    }

    activeElement.addEventListener("loadedmetadata", setDur)
    activeElement.addEventListener("durationchange", setDur)
    activeElement.addEventListener("timeupdate", setTime)
    activeElement.addEventListener("play", onPlay)
    activeElement.addEventListener("pause", onPause)
    activeElement.addEventListener("ended", onEnded)

    // Initialize state from element
    setDur()
    setTime()
    setIsPlaying(!activeElement.paused)
    setIsRepeating(activeElement.loop)

    const cleanup = () => {
      activeElement.removeEventListener("loadedmetadata", setDur)
      activeElement.removeEventListener("durationchange", setDur)
      activeElement.removeEventListener("timeupdate", setTime)
      activeElement.removeEventListener("play", onPlay)
      activeElement.removeEventListener("pause", onPause)
      activeElement.removeEventListener("ended", onEnded)
    }

    return cleanup
  }, [getActiveMediaElement, nextTrack, playlist.length, currentIndex])

  // Reset state when the current media item changes
  useEffect(() => {
    setCurrentTime(0)
    setDuration(0)
    setIsPlaying(false)
    
    // Pause any active media when source changes
    const activeElement = getActiveMediaElement()
    if (activeElement) {
      activeElement.pause()
    }
  }, [currentRow?.url, getActiveMediaElement])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
      }
      
      // Cleanup audio manager when component unmounts
      if (audioManager.current) {
        const globalAudio = audioManager.current.getGlobalAudioElement()
        if (globalAudio) {
          audioManager.current.destroyAudioElement(globalAudio)
        }
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