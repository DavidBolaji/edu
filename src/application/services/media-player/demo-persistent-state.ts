/**
 * Demo script to verify persistent state management system
 * This demonstrates the key functionality of the implementation
 */

import { PlaybackState } from '@/src/entities/models/media';
import { PlaybackStateManager } from './playback-state-manager';

export async function demoPersistentStateManagement(): Promise<void> {
  console.log('🎵 Demo: Persistent State Management System');
  console.log('==========================================');

  const stateManager = new PlaybackStateManager();

  // Demo 1: Save and load state
  console.log('\n1. Testing state persistence...');
  
  const testState: PlaybackState = {
    mediaId: 'demo-audio-123',
    currentTime: 125.5,
    duration: 300,
    volume: 0.8,
    playbackRate: 1.0,
    isPlaying: true,
    lastUpdated: new Date()
  };

  try {
    await stateManager.saveState(testState);
    console.log('✅ State saved successfully');

    const loadedState = await stateManager.loadState('demo-audio-123');
    if (loadedState) {
      console.log('✅ State loaded successfully');
      console.log(`   Current time: ${loadedState.currentTime}s`);
      console.log(`   Volume: ${loadedState.volume}`);
      console.log(`   Playing: ${loadedState.isPlaying}`);
    } else {
      console.log('❌ Failed to load state');
    }
  } catch (error) {
    console.error('❌ Error in state persistence:', error);
  }

  // Demo 2: Auto-save functionality
  console.log('\n2. Testing auto-save functionality...');
  
  let currentTime = 125.5;
  const getState = (): PlaybackState => ({
    mediaId: 'demo-audio-123',
    currentTime: currentTime,
    duration: 300,
    volume: 0.8,
    playbackRate: 1.0,
    isPlaying: true,
    lastUpdated: new Date()
  });

  // Start auto-save with 1-second interval for demo
  stateManager.startAutoSave(getState, 1000);
  console.log('✅ Auto-save started (1-second interval)');

  // Simulate playback progress
  const progressSimulation = setInterval(() => {
    currentTime += 1;
    console.log(`   Simulating playback: ${currentTime}s`);
    
    if (currentTime >= 130) {
      clearInterval(progressSimulation);
      stateManager.stopAutoSave();
      console.log('✅ Auto-save stopped');
      
      // Demo 3: Cross-tab sync demonstration
      demonstrateCrossTabSync(stateManager);
    }
  }, 1100);
}

async function demonstrateCrossTabSync(stateManager: PlaybackStateManager): Promise<void> {
  console.log('\n3. Testing cross-tab synchronization...');
  
  // Register state restoration listener
  stateManager.onStateRestored((state) => {
    console.log('✅ State restored from cross-tab sync');
    console.log(`   Media: ${state.mediaId}`);
    console.log(`   Position: ${state.currentTime}s`);
  });

  // Simulate state change from another tab
  const externalState: PlaybackState = {
    mediaId: 'demo-audio-123',
    currentTime: 200.0,
    duration: 300,
    volume: 0.9,
    playbackRate: 1.25,
    isPlaying: false,
    lastUpdated: new Date()
  };

  try {
    await stateManager.saveState(externalState);
    console.log('✅ External state change simulated');
    
    // Load state to trigger restoration
    const restoredState = await stateManager.restoreStateOnNavigation('demo-audio-123');
    if (restoredState) {
      console.log('✅ State restoration on navigation successful');
    }
  } catch (error) {
    console.error('❌ Error in cross-tab sync demo:', error);
  }

  // Demo 4: Cleanup and statistics
  await demonstrateCleanupAndStats(stateManager);
}

async function demonstrateCleanupAndStats(stateManager: PlaybackStateManager): Promise<void> {
  console.log('\n4. Testing cleanup and statistics...');
  
  try {
    // Get all states
    const allStates = await stateManager.getAllStates();
    console.log(`✅ Total states in storage: ${allStates.length}`);

    // Get statistics
    const stats = stateManager.getStats();
    console.log('✅ Manager statistics:');
    console.log(`   Auto-save active: ${stats.autoSaveActive}`);
    console.log(`   Cross-tab sync enabled: ${stats.crossTabSyncEnabled}`);
    console.log(`   Current state exists: ${stats.currentStateExists}`);

    // Export states for backup
    const exportedStates = await stateManager.exportStates();
    console.log(`✅ Exported ${exportedStates.length} states for backup`);

    // Clean up
    await stateManager.close();
    console.log('✅ State manager closed and cleaned up');

  } catch (error) {
    console.error('❌ Error in cleanup demo:', error);
  }

  console.log('\n🎉 Demo completed successfully!');
  console.log('==========================================');
}

// Function is already exported above