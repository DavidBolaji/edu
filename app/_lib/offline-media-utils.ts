/**
 * Offline Media Utilities
 * 
 * Utilities for converting offline media from IndexedDB cache to MediaItem format
 * and managing blob URLs for offline playback.
 */

import { MediaItem, MediaType } from '@/src/entities/models/media';

/**
 * Global registry to track active blob URLs
 * This prevents memory leaks by ensuring all blob URLs are properly revoked
 */
const activeBlobUrls = new Set<string>();

/**
 * Offline media structure from library route
 */
interface OfflineMedia {
  id: string;
  name: string;
  fileName?: string;
  size: number;
  format: string;
  url: string;
  type: 'AUDIO' | 'VIDEO' | 'EBOOK';
  course: {
    title: string;
  };
  level: {
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Cache name for offline media storage
 * This should match the cache name used in the service worker and use-cached-media hook
 */
const OFFLINE_MEDIA_CACHE_NAME = 'media-cache-v5';

/**
 * Converts offline media from IndexedDB cache to MediaItem format
 * suitable for use with the unified media player.
 * 
 * @param offlineMedia - The offline media object from the library
 * @returns Promise<MediaItem> - Media item with blob URL for playback
 * @throws Error if media is not found in cache or conversion fails
 */
export async function convertOfflineMediaToMediaItem(
  offlineMedia: OfflineMedia
): Promise<MediaItem> {
  try {
    // Open the cache
    const cache = await caches.open(OFFLINE_MEDIA_CACHE_NAME);
    
    // Try to get the cached response
    const response = await cache.match(offlineMedia.url);
    
    if (!response) {
      throw new Error(
        `Media not found in cache: ${offlineMedia.name}. Please download it again.`
      );
    }
    
    // Get the blob from the response
    const blob = await response.blob();
    
    if (!blob || blob.size === 0) {
      throw new Error(
        `Invalid cached media: ${offlineMedia.name}. The file may be corrupted.`
      );
    }
    
    // Create a blob URL for playback
    const blobUrl = URL.createObjectURL(blob);
    
    // Track the blob URL for cleanup
    activeBlobUrls.add(blobUrl);
    
    // Convert to MediaItem format
    const mediaItem: MediaItem = {
      id: offlineMedia.id,
      name: offlineMedia.fileName || offlineMedia.name,
      type: MediaType[offlineMedia.type],
      url: blobUrl, // Use blob URL instead of original URL
      size: offlineMedia.size,
      format: offlineMedia.format,
      courseId: '', // Not available in offline media structure
      levelId: '', // Not available in offline media structure
      userId: '', // Not available in offline media structure
      metadata: {
        title: offlineMedia.name,
        description: `${offlineMedia.course.title} - ${offlineMedia.level.name}`,
      },
      createdAt: offlineMedia.createdAt,
      updatedAt: offlineMedia.updatedAt,
    };
    
    return mediaItem;
  } catch (error) {
    // Enhance error message for better user feedback
    if (error instanceof Error) {
      throw new Error(`Failed to load offline media: ${error.message}`);
    }
    throw new Error(
      `Failed to load offline media: ${offlineMedia.name}. Please check if the file is downloaded.`
    );
  }
}


/**
 * Cleans up a blob URL by revoking it and removing it from the active registry
 * 
 * @param blobUrl - The blob URL to clean up
 * @returns boolean - True if the URL was successfully cleaned up, false if it wasn't tracked
 */
export function cleanupBlobUrl(blobUrl: string): boolean {
  if (!blobUrl || !blobUrl.startsWith('blob:')) {
    console.warn('[BlobCleanup] Invalid blob URL provided:', blobUrl);
    return false;
  }
  
  // Check if this URL is tracked
  if (!activeBlobUrls.has(blobUrl)) {
    console.warn('[BlobCleanup] Blob URL not found in active registry:', blobUrl);
    return false;
  }
  
  try {
    // Revoke the blob URL to free memory
    URL.revokeObjectURL(blobUrl);
    
    // Remove from tracking registry
    activeBlobUrls.delete(blobUrl);
    
    console.log('[BlobCleanup] Successfully cleaned up blob URL:', blobUrl);
    return true;
  } catch (error) {
    console.error('[BlobCleanup] Failed to revoke blob URL:', error);
    // Still remove from registry even if revoke failed
    activeBlobUrls.delete(blobUrl);
    return false;
  }
}

/**
 * Cleans up multiple blob URLs at once
 * 
 * @param blobUrls - Array of blob URLs to clean up
 * @returns number - Count of successfully cleaned up URLs
 */
export function cleanupBlobUrls(blobUrls: string[]): number {
  let cleanedCount = 0;
  
  for (const url of blobUrls) {
    if (cleanupBlobUrl(url)) {
      cleanedCount++;
    }
  }
  
  console.log(`[BlobCleanup] Cleaned up ${cleanedCount} of ${blobUrls.length} blob URLs`);
  return cleanedCount;
}

/**
 * Cleans up all active blob URLs
 * Useful for cleanup on component unmount or application shutdown
 * 
 * @returns number - Count of cleaned up URLs
 */
export function cleanupAllBlobUrls(): number {
  const urlsToCleanup = Array.from(activeBlobUrls);
  const count = cleanupBlobUrls(urlsToCleanup);
  
  console.log(`[BlobCleanup] Cleaned up all ${count} active blob URLs`);
  return count;
}

/**
 * Gets the count of currently active blob URLs
 * Useful for debugging and monitoring memory usage
 * 
 * @returns number - Count of active blob URLs
 */
export function getActiveBlobUrlCount(): number {
  return activeBlobUrls.size;
}

/**
 * Gets all currently active blob URLs
 * Useful for debugging
 * 
 * @returns string[] - Array of active blob URLs
 */
export function getActiveBlobUrls(): string[] {
  return Array.from(activeBlobUrls);
}

/**
 * Checks if a blob URL is currently tracked as active
 * 
 * @param blobUrl - The blob URL to check
 * @returns boolean - True if the URL is tracked, false otherwise
 */
export function isBlobUrlActive(blobUrl: string): boolean {
  return activeBlobUrls.has(blobUrl);
}

/**
 * Validation result for cached media
 */
export interface CacheValidationResult {
  isValid: boolean;
  exists: boolean;
  isCorrupted: boolean;
  size?: number;
  contentType?: string;
  error?: string;
  message?: string;
}

/**
 * Validates if media exists in cache and is not corrupted
 * 
 * @param mediaUrl - The URL of the media to validate
 * @param expectedSize - Optional expected file size for validation
 * @returns Promise<CacheValidationResult> - Validation result with details
 */
export async function validateCachedMedia(
  mediaUrl: string,
  expectedSize?: number
): Promise<CacheValidationResult> {
  try {
    // Check if Cache API is available
    if (!('caches' in window)) {
      return {
        isValid: false,
        exists: false,
        isCorrupted: false,
        error: 'Cache API not available',
        message: 'Your browser does not support offline media playback.',
      };
    }

    // Open the cache
    const cache = await caches.open(OFFLINE_MEDIA_CACHE_NAME);
    
    // Try to get the cached response
    const response = await cache.match(mediaUrl);
    
    // Check if media exists in cache
    if (!response) {
      return {
        isValid: false,
        exists: false,
        isCorrupted: false,
        error: 'Media not found in cache',
        message: 'This media is not available offline. Please download it first.',
      };
    }
    
    // Check response status
    if (!response.ok) {
      return {
        isValid: false,
        exists: true,
        isCorrupted: true,
        error: `Invalid response status: ${response.status}`,
        message: 'The cached media file is corrupted. Please download it again.',
      };
    }
    
    // Get the blob to validate content
    const blob = await response.blob();
    
    // Check if blob is valid
    if (!blob) {
      return {
        isValid: false,
        exists: true,
        isCorrupted: true,
        error: 'Failed to read cached blob',
        message: 'The cached media file is corrupted. Please download it again.',
      };
    }
    
    // Check if blob has content
    if (blob.size === 0) {
      return {
        isValid: false,
        exists: true,
        isCorrupted: true,
        size: 0,
        error: 'Cached blob is empty',
        message: 'The cached media file is empty. Please download it again.',
      };
    }
    
    // Validate size if expected size is provided
    if (expectedSize && blob.size !== expectedSize) {
      return {
        isValid: false,
        exists: true,
        isCorrupted: true,
        size: blob.size,
        error: `Size mismatch: expected ${expectedSize}, got ${blob.size}`,
        message: 'The cached media file size does not match. Please download it again.',
      };
    }
    
    // Validate content type
    const contentType = blob.type;
    if (!contentType) {
      console.warn('[CacheValidation] No content type found for cached media');
    }
    
    // All validations passed
    return {
      isValid: true,
      exists: true,
      isCorrupted: false,
      size: blob.size,
      contentType: contentType || undefined,
      message: 'Media is valid and ready for playback.',
    };
    
  } catch (error) {
    // Handle unexpected errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return {
      isValid: false,
      exists: false,
      isCorrupted: false,
      error: `Validation failed: ${errorMessage}`,
      message: 'Failed to validate cached media. Please try again.',
    };
  }
}

/**
 * Validates multiple cached media items at once
 * 
 * @param mediaUrls - Array of media URLs to validate
 * @returns Promise<Map<string, CacheValidationResult>> - Map of URL to validation result
 */
export async function validateMultipleCachedMedia(
  mediaUrls: string[]
): Promise<Map<string, CacheValidationResult>> {
  const results = new Map<string, CacheValidationResult>();
  
  // Validate all media in parallel
  const validationPromises = mediaUrls.map(async (url) => {
    const result = await validateCachedMedia(url);
    return { url, result };
  });
  
  const validations = await Promise.all(validationPromises);
  
  // Build results map
  for (const { url, result } of validations) {
    results.set(url, result);
  }
  
  return results;
}

/**
 * Checks if media exists in cache (quick check without full validation)
 * 
 * @param mediaUrl - The URL of the media to check
 * @returns Promise<boolean> - True if media exists in cache, false otherwise
 */
export async function isCachedMediaAvailable(mediaUrl: string): Promise<boolean> {
  try {
    if (!('caches' in window)) {
      return false;
    }
    
    const cache = await caches.open(OFFLINE_MEDIA_CACHE_NAME);
    const response = await cache.match(mediaUrl);
    
    return !!response;
  } catch (error) {
    console.error('[CacheCheck] Failed to check cache availability:', error);
    return false;
  }
}

/**
 * Gets cache statistics for debugging and monitoring
 * 
 * @returns Promise<{ totalItems: number; totalSize: number }> - Cache statistics
 */
export async function getCacheStats(): Promise<{ totalItems: number; totalSize: number }> {
  try {
    if (!('caches' in window)) {
      return { totalItems: 0, totalSize: 0 };
    }
    
    const cache = await caches.open(OFFLINE_MEDIA_CACHE_NAME);
    const keys = await cache.keys();
    
    let totalSize = 0;
    
    // Calculate total size
    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
    
    return {
      totalItems: keys.length,
      totalSize,
    };
  } catch (error) {
    console.error('[CacheStats] Failed to get cache statistics:', error);
    return { totalItems: 0, totalSize: 0 };
  }
}
