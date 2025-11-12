/**
 * Resource Manager
 * Single Responsibility: Manage media player resources and prevent memory leaks
 * Implements resource pooling and comprehensive cleanup strategies
 */

export interface IResourceManager {
  registerResource(id: string, resource: ManagedResource): void;
  unregisterResource(id: string): void;
  cleanupResource(id: string): Promise<void>;
  cleanupAll(): Promise<void>;
  getResourceStats(): ResourceStats;
}

export interface ManagedResource {
  type: 'audio' | 'video' | 'iframe' | 'interval' | 'timeout' | 'listener' | 'element';
  resource: any;
  cleanup: () => void | Promise<void>;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface ResourceStats {
  totalResources: number;
  resourcesByType: Record<string, number>;
  oldestResource: Date | null;
  memoryEstimate: number;
}

export class ResourceManager implements IResourceManager {
  private resources: Map<string, ManagedResource> = new Map();
  private cleanupCallbacks: Set<() => void | Promise<void>> = new Set();
  private isCleaningUp = false;
  private cleanupTimeout: NodeJS.Timeout | null = null;

  /**
   * Register a resource for managed cleanup
   */
  registerResource(id: string, resource: ManagedResource): void {
    // If resource already exists, clean it up first
    if (this.resources.has(id)) {
      this.cleanupResource(id).catch(error => {
        console.error(`Failed to cleanup existing resource ${id}:`, error);
      });
    }

    this.resources.set(id, resource);
  }

  /**
   * Unregister a resource without cleanup
   */
  unregisterResource(id: string): void {
    this.resources.delete(id);
  }

  /**
   * Cleanup a specific resource
   */
  async cleanupResource(id: string): Promise<void> {
    const resource = this.resources.get(id);
    
    if (!resource) {
      return;
    }

    try {
      await resource.cleanup();
      this.resources.delete(id);
    } catch (error) {
      console.error(`Failed to cleanup resource ${id}:`, error);
      // Still remove from tracking even if cleanup failed
      this.resources.delete(id);
    }
  }

  /**
   * Cleanup all registered resources
   */
  async cleanupAll(): Promise<void> {
    if (this.isCleaningUp) {
      return;
    }

    this.isCleaningUp = true;

    try {
      // Clear any pending cleanup timeout
      if (this.cleanupTimeout) {
        clearTimeout(this.cleanupTimeout);
        this.cleanupTimeout = null;
      }

      // Cleanup all resources in parallel
      const resourceEntries = Array.from(this.resources.entries());
      const cleanupPromises = resourceEntries.map(
        async ([id, resource]) => {
          try {
            await resource.cleanup();
          } catch (error) {
            console.error(`Failed to cleanup resource ${id}:`, error);
          }
        }
      );

      await Promise.all(cleanupPromises);

      // Clear the resources map
      this.resources.clear();

      // Execute cleanup callbacks
      const callbacks = Array.from(this.cleanupCallbacks);
      const callbackPromises = callbacks.map(
        async (callback) => {
          try {
            await callback();
          } catch (error) {
            console.error('Cleanup callback failed:', error);
          }
        }
      );

      await Promise.all(callbackPromises);
    } finally {
      this.isCleaningUp = false;
    }
  }

  /**
   * Register a cleanup callback
   */
  onCleanup(callback: () => void | Promise<void>): void {
    this.cleanupCallbacks.add(callback);
  }

  /**
   * Remove a cleanup callback
   */
  removeCleanupCallback(callback: () => void | Promise<void>): void {
    this.cleanupCallbacks.delete(callback);
  }

  /**
   * Schedule automatic cleanup after delay
   */
  scheduleCleanup(delayMs: number = 5000): void {
    if (this.cleanupTimeout) {
      clearTimeout(this.cleanupTimeout);
    }

    this.cleanupTimeout = setTimeout(() => {
      this.cleanupAll().catch(error => {
        console.error('Scheduled cleanup failed:', error);
      });
    }, delayMs);
  }

  /**
   * Cancel scheduled cleanup
   */
  cancelScheduledCleanup(): void {
    if (this.cleanupTimeout) {
      clearTimeout(this.cleanupTimeout);
      this.cleanupTimeout = null;
    }
  }

  /**
   * Get statistics about managed resources
   */
  getResourceStats(): ResourceStats {
    const resourcesByType: Record<string, number> = {};
    let oldestResource: Date | null = null;
    let memoryEstimate = 0;

    const resourceEntries = Array.from(this.resources.entries());
    for (const [, resource] of resourceEntries) {
      // Count by type
      resourcesByType[resource.type] = (resourcesByType[resource.type] || 0) + 1;

      // Track oldest resource
      if (!oldestResource || resource.createdAt < oldestResource) {
        oldestResource = resource.createdAt;
      }

      // Estimate memory usage (rough approximation)
      memoryEstimate += this.estimateResourceMemory(resource);
    }

    return {
      totalResources: this.resources.size,
      resourcesByType,
      oldestResource,
      memoryEstimate
    };
  }

  /**
   * Check if any resources are registered
   */
  hasResources(): boolean {
    return this.resources.size > 0;
  }

  /**
   * Get resource by ID
   */
  getResource(id: string): ManagedResource | undefined {
    return this.resources.get(id);
  }

  /**
   * Cleanup resources older than specified age
   */
  async cleanupOldResources(maxAgeMs: number): Promise<void> {
    const now = new Date();
    const resourcesToCleanup: string[] = [];

    const resourceEntries = Array.from(this.resources.entries());
    for (const [id, resource] of resourceEntries) {
      const age = now.getTime() - resource.createdAt.getTime();
      if (age > maxAgeMs) {
        resourcesToCleanup.push(id);
      }
    }

    await Promise.all(
      resourcesToCleanup.map(id => this.cleanupResource(id))
    );
  }

  /**
   * Estimate memory usage of a resource (rough approximation)
   */
  private estimateResourceMemory(resource: ManagedResource): number {
    switch (resource.type) {
      case 'audio':
      case 'video':
        // Media elements can use significant memory
        return 1024 * 1024; // 1MB estimate
      case 'iframe':
        // Iframes can use substantial memory
        return 512 * 1024; // 512KB estimate
      case 'element':
        // DOM elements
        return 10 * 1024; // 10KB estimate
      case 'listener':
      case 'interval':
      case 'timeout':
        // Small overhead
        return 1024; // 1KB estimate
      default:
        return 1024;
    }
  }
}

/**
 * Media Element Pool
 * Implements resource pooling for efficient media element reuse
 */
export class MediaElementPool {
  private audioPool: HTMLAudioElement[] = [];
  private videoPool: HTMLVideoElement[] = [];
  private maxPoolSize: number;
  private inUse: Set<HTMLMediaElement> = new Set();

  constructor(maxPoolSize: number = 3) {
    this.maxPoolSize = maxPoolSize;
  }

  /**
   * Acquire an audio element from the pool
   */
  acquireAudio(): HTMLAudioElement {
    let audio = this.audioPool.pop();

    if (!audio) {
      audio = document.createElement('audio');
      audio.preload = 'metadata';
    }

    this.inUse.add(audio);
    return audio;
  }

  /**
   * Acquire a video element from the pool
   */
  acquireVideo(): HTMLVideoElement {
    let video = this.videoPool.pop();

    if (!video) {
      video = document.createElement('video');
      video.preload = 'metadata';
      video.playsInline = true;
    }

    this.inUse.add(video);
    return video;
  }

  /**
   * Release an audio element back to the pool
   */
  releaseAudio(audio: HTMLAudioElement): void {
    if (!this.inUse.has(audio)) {
      return;
    }

    this.inUse.delete(audio);

    // Clean the element before returning to pool
    this.cleanMediaElement(audio);

    // Only add back to pool if under max size
    if (this.audioPool.length < this.maxPoolSize) {
      this.audioPool.push(audio);
    } else {
      // Dispose of excess elements
      audio.remove();
    }
  }

  /**
   * Release a video element back to the pool
   */
  releaseVideo(video: HTMLVideoElement): void {
    if (!this.inUse.has(video)) {
      return;
    }

    this.inUse.delete(video);

    // Clean the element before returning to pool
    this.cleanMediaElement(video);

    // Only add back to pool if under max size
    if (this.videoPool.length < this.maxPoolSize) {
      this.videoPool.push(video);
    } else {
      // Dispose of excess elements
      video.remove();
    }
  }

  /**
   * Clean all pooled elements
   */
  cleanup(): void {
    // Cleanup audio pool
    const audioElements = [...this.audioPool];
    for (const audio of audioElements) {
      this.cleanMediaElement(audio);
      audio.remove();
    }
    this.audioPool = [];

    // Cleanup video pool
    const videoElements = [...this.videoPool];
    for (const video of videoElements) {
      this.cleanMediaElement(video);
      video.remove();
    }
    this.videoPool = [];

    // Cleanup in-use elements
    const inUseElements = Array.from(this.inUse);
    for (const element of inUseElements) {
      this.cleanMediaElement(element);
      element.remove();
    }
    this.inUse.clear();
  }

  /**
   * Get pool statistics
   */
  getStats(): {
    audioPoolSize: number;
    videoPoolSize: number;
    inUseCount: number;
    totalElements: number;
  } {
    return {
      audioPoolSize: this.audioPool.length,
      videoPoolSize: this.videoPool.length,
      inUseCount: this.inUse.size,
      totalElements: this.audioPool.length + this.videoPool.length + this.inUse.size
    };
  }

  /**
   * Clean a media element for reuse
   */
  private cleanMediaElement(element: HTMLMediaElement): void {
    try {
      // Pause and reset
      element.pause();
      element.currentTime = 0;
      element.src = '';
      element.load();

      // Remove all event listeners by cloning
      const clone = element.cloneNode(false) as HTMLMediaElement;
      element.parentNode?.replaceChild(clone, element);
    } catch (error) {
      console.error('Failed to clean media element:', error);
    }
  }
}

/**
 * Event Listener Manager
 * Tracks and manages event listeners for proper cleanup
 */
export class EventListenerManager {
  private listeners: Map<
    EventTarget,
    Array<{
      event: string;
      handler: EventListenerOrEventListenerObject;
      options?: boolean | AddEventListenerOptions;
    }>
  > = new Map();

  /**
   * Add an event listener and track it
   */
  addEventListener(
    target: EventTarget,
    event: string,
    handler: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void {
    target.addEventListener(event, handler, options);

    if (!this.listeners.has(target)) {
      this.listeners.set(target, []);
    }

    this.listeners.get(target)!.push({ event, handler, options });
  }

  /**
   * Remove a specific event listener
   */
  removeEventListener(
    target: EventTarget,
    event: string,
    handler: EventListenerOrEventListenerObject
  ): void {
    target.removeEventListener(event, handler);

    const targetListeners = this.listeners.get(target);
    if (targetListeners) {
      const index = targetListeners.findIndex(
        l => l.event === event && l.handler === handler
      );
      if (index !== -1) {
        targetListeners.splice(index, 1);
      }

      if (targetListeners.length === 0) {
        this.listeners.delete(target);
      }
    }
  }

  /**
   * Remove all event listeners from a target
   */
  removeAllListeners(target: EventTarget): void {
    const targetListeners = this.listeners.get(target);
    
    if (targetListeners) {
      for (const { event, handler } of targetListeners) {
        target.removeEventListener(event, handler);
      }
      this.listeners.delete(target);
    }
  }

  /**
   * Remove all tracked event listeners
   */
  cleanup(): void {
    const listenerEntries = Array.from(this.listeners.entries());
    for (const [target, targetListeners] of listenerEntries) {
      for (const { event, handler } of targetListeners) {
        try {
          target.removeEventListener(event, handler);
        } catch (error) {
          console.error('Failed to remove event listener:', error);
        }
      }
    }
    this.listeners.clear();
  }

  /**
   * Get statistics about tracked listeners
   */
  getStats(): {
    totalTargets: number;
    totalListeners: number;
    listenersByTarget: Map<EventTarget, number>;
  } {
    const listenersByTarget = new Map<EventTarget, number>();
    let totalListeners = 0;

    for (const [target, targetListeners] of this.listeners) {
      listenersByTarget.set(target, targetListeners.length);
      totalListeners += targetListeners.length;
    }

    return {
      totalTargets: this.listeners.size,
      totalListeners,
      listenersByTarget
    };
  }
}
