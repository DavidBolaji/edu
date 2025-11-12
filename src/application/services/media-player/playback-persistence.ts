/**
 * Playback Persistence Service
 * Single Responsibility: Handle IndexedDB storage for playback states
 * Implements IPlaybackPersistence interface
 */

import { PlaybackState } from '@/src/entities/models/media';
import { IPlaybackPersistence } from '@/src/entities/models/media-player';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface PlaybackStateDB extends DBSchema {
  playbackStates: {
    key: string;
    value: PlaybackState & { lastUpdated: Date };
    indexes: { 'by-updated': Date };
  };
}

export class PlaybackPersistence implements IPlaybackPersistence {
  private readonly dbName = 'edu-pwa-media-persistence';
  private readonly dbVersion = 1;
  private readonly storeName = 'playbackStates' as const;
  private db: IDBPDatabase<PlaybackStateDB> | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initPromise = this.initDB();
  }

  private async initDB(): Promise<void> {
    try {
      this.db = await openDB<PlaybackStateDB>(this.dbName, this.dbVersion, {
        upgrade(db, oldVersion, newVersion, transaction) {
          // Create object store if it doesn't exist
          if (!db.objectStoreNames.contains('playbackStates')) {
            const store = db.createObjectStore('playbackStates', {
              keyPath: 'mediaId'
            });
            // Create index for cleanup operations
            store.createIndex('by-updated', 'lastUpdated');
          }
        },
        blocked() {
          console.warn('PlaybackPersistence DB upgrade blocked by another tab');
        },
        blocking() {
          console.warn('PlaybackPersistence DB blocking another tab upgrade');
        }
      });
    } catch (error) {
      console.error('Failed to initialize PlaybackPersistence DB:', error);
      throw new Error('Database initialization failed');
    }
  }

  private async ensureDB(): Promise<IDBPDatabase<PlaybackStateDB>> {
    if (!this.db) {
      if (this.initPromise) {
        await this.initPromise;
      } else {
        await this.initDB();
      }
    }

    if (!this.db) {
      throw new Error('Database not available');
    }

    return this.db;
  }

  async saveState(state: PlaybackState): Promise<void> {
    try {
      const db = await this.ensureDB();
      
      const stateWithTimestamp = {
        ...state,
        lastUpdated: new Date()
      };

      await db.put(this.storeName, stateWithTimestamp);
    } catch (error) {
      console.error('Failed to save playback state:', error);
      throw new Error(`Failed to save playback state: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async loadState(mediaId: string): Promise<PlaybackState | null> {
    try {
      const db = await this.ensureDB();
      const result = await db.get(this.storeName, mediaId);
      
      if (!result) {
        return null;
      }

      // Return the complete state including lastUpdated
      return result;
    } catch (error) {
      console.error('Failed to load playback state:', error);
      return null;
    }
  }

  async clearState(mediaId: string): Promise<void> {
    try {
      const db = await this.ensureDB();
      await db.delete(this.storeName, mediaId);
    } catch (error) {
      console.error('Failed to clear playback state:', error);
      // Don't throw here as clearing is often a cleanup operation
    }
  }

  async getAllStates(): Promise<PlaybackState[]> {
    try {
      const db = await this.ensureDB();
      const results = await db.getAll(this.storeName);
      
      // Return all results including lastUpdated
      return results;
    } catch (error) {
      console.error('Failed to get all playback states:', error);
      return [];
    }
  }

  async exportStates(): Promise<PlaybackState[]> {
    return this.getAllStates();
  }

  async importStates(states: PlaybackState[]): Promise<void> {
    try {
      const db = await this.ensureDB();
      const tx = db.transaction(this.storeName, 'readwrite');
      
      const importPromises = states.map(state => 
        tx.store.put({
          ...state,
          lastUpdated: new Date()
        })
      );

      await Promise.all(importPromises);
      await tx.done;
    } catch (error) {
      console.error('Failed to import playback states:', error);
      throw new Error(`Failed to import states: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async cleanupOldStates(daysOld: number = 30): Promise<void> {
    try {
      const db = await this.ensureDB();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const tx = db.transaction(this.storeName, 'readwrite');
      const index = tx.store.index('by-updated');
      
      // Use cursor to iterate through old states
      let cursor = await index.openCursor(IDBKeyRange.upperBound(cutoffDate));
      let deletedCount = 0;
      
      while (cursor) {
        await cursor.delete();
        deletedCount++;
        cursor = await cursor.continue();
      }

      await tx.done;
      
      if (deletedCount > 0) {
        console.log(`Cleaned up ${deletedCount} old playback states`);
      }
    } catch (error) {
      console.error('Failed to cleanup old playback states:', error);
      // Don't throw as cleanup is a maintenance operation
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.initPromise = null;
  }

  /**
   * Get database statistics for monitoring
   */
  async getStats(): Promise<{ totalStates: number; oldestState: Date | null; newestState: Date | null }> {
    try {
      const db = await this.ensureDB();
      const tx = db.transaction(this.storeName, 'readonly');
      const index = tx.store.index('by-updated');
      
      const totalStates = await tx.store.count();
      const oldestCursor = await index.openCursor();
      const newestCursor = await index.openCursor(null, 'prev');
      
      const oldestState = oldestCursor?.value?.lastUpdated || null;
      const newestState = newestCursor?.value?.lastUpdated || null;
      
      await tx.done;
      
      return {
        totalStates,
        oldestState,
        newestState
      };
    } catch (error) {
      console.error('Failed to get database stats:', error);
      return {
        totalStates: 0,
        oldestState: null,
        newestState: null
      };
    }
  }
}