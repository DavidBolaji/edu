import { AudioManager } from '@/src/entities/models/media'

export class AudioManagerService implements AudioManager {
  private static instance: AudioManagerService | null = null
  private audioContext: AudioContext | null = null
  private activeAudioElements: Set<HTMLAudioElement> = new Set()
  private globalAudioElement: HTMLAudioElement | null = null

  private constructor() {
    this.initializeAudioContext()
  }

  public static getInstance(): AudioManagerService {
    if (!AudioManagerService.instance) {
      AudioManagerService.instance = new AudioManagerService()
    }
    return AudioManagerService.instance
  }

  private initializeAudioContext(): void {
    if (typeof window !== 'undefined') {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      } catch (error) {
        console.warn('AudioContext not supported:', error)
      }
    }
  }

  public async resumeAudioContext(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume()
      } catch (error) {
        console.warn('Failed to resume audio context:', error)
      }
    }
  }

  public createAudioElement(): HTMLAudioElement {
    // Always return the same global audio element to prevent duplicates
    if (this.globalAudioElement) {
      // Ensure no other audio is playing before returning
      this.preventDuplicateStreams()
      return this.globalAudioElement
    }

    // First, clean up any existing audio elements in the DOM
    this.preventDuplicateStreams()

    const audio = document.createElement('audio')
    audio.preload = 'metadata'
    audio.style.display = 'none'
    audio.setAttribute('data-global-audio', 'true')
    document.body.appendChild(audio)

    this.globalAudioElement = audio
    this.activeAudioElements.add(audio)

    return audio
  }

  public destroyAudioElement(element: HTMLAudioElement): void {
    if (element === this.globalAudioElement) {
      element.pause()
      element.src = ''
      element.load()
      
      if (element.parentNode) {
        element.parentNode.removeChild(element)
      }
      
      this.activeAudioElements.delete(element)
      this.globalAudioElement = null
    }
  }

  public preventDuplicateStreams(): void {
    // Pause and mute all audio elements except the global one
    const allAudioElements = document.querySelectorAll('audio')
    allAudioElements.forEach((audio) => {
      if (audio !== this.globalAudioElement) {
        // Pause any playing audio
        if (!audio.paused) {
          audio.pause()
        }
        // Mute to prevent any sound
        audio.muted = true
        // Remove src to prevent loading/playing
        if (audio.src) {
          audio.removeAttribute('src')
          audio.load()
        }
      }
    })
  }

  public syncAudioElements(primary: HTMLAudioElement, secondary: HTMLAudioElement): () => void {
    // For our use case, we don't sync - we use only the primary element
    // Secondary element is muted and hidden
    secondary.muted = true
    secondary.style.display = 'none'

    const cleanup = () => {
      // No cleanup needed as secondary is not used
    }

    return cleanup
  }

  public getGlobalAudioElement(): HTMLAudioElement | null {
    return this.globalAudioElement
  }

  public cleanup(): void {
    // Cleanup all active audio elements
    this.activeAudioElements.forEach((element) => {
      element.pause()
      element.src = ''
      element.load()
      if (element.parentNode) {
        element.parentNode.removeChild(element)
      }
    })

    this.activeAudioElements.clear()
    this.globalAudioElement = null

    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
  }

  public muteAllExcept(exceptElement?: HTMLAudioElement): void {
    const allAudioElements = document.querySelectorAll('audio')
    allAudioElements.forEach((audio) => {
      if (audio !== exceptElement) {
        // Mute the element
        audio.muted = true
        // Pause if playing
        if (!audio.paused) {
          audio.pause()
        }
        // Remove src to prevent any background loading
        if (audio.src && audio !== this.globalAudioElement) {
          audio.removeAttribute('src')
          audio.load()
        }
      }
    })
  }

  public pauseAllAudio(): void {
    const allAudioElements = document.querySelectorAll('audio')
    allAudioElements.forEach((audio) => {
      if (!audio.paused) {
        audio.pause()
      }
    })
  }

  public stopAndClearGlobalAudio(): void {
    if (this.globalAudioElement) {
      this.globalAudioElement.pause()
      this.globalAudioElement.currentTime = 0
      // Don't remove src here, just pause and reset
    }
  }
}