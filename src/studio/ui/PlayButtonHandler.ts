/**
 * Play Button Handler - Enhanced play button functionality with auto-simulation loading
 *
 * This module provides intelligent play button behavior:
 * - Auto-loads flag simulation if no simulation is currently loaded
 * - Ensures smooth simulation startup without console pollution
 * - Provides proper button state management
 */

import { Logger } from '../../core/utils/Logger';
import { Studio } from '../Studio';
import { StateManager } from '../state/StateManager';

/**
 * Handle play button click with intelligent auto-loading
 *
 * @param studio - The Studio instance
 * @param stateManager - The state manager instance
 */
export async function handlePlayButtonClick(
  studio: Studio,
  stateManager: StateManager
): Promise<void> {
  try {
    const currentSimulation = stateManager.selectedSimulation.getSimulationName();

    // If no simulation is loaded, auto-load the flag simulation
    if (!currentSimulation || currentSimulation.trim() === '') {
      Logger.getInstance().log('No simulation loaded, auto-loading flag simulation for play');

      // Check if flag simulation is available
      const availableSims = studio.getAvailableSimulationNames();
      if (availableSims.includes('flag-simulation')) {
        await studio.loadSimulation('flag-simulation');
        Logger.getInstance().log('Flag simulation auto-loaded for play button');
      } else {
        Logger.getInstance().warn('No simulations available to auto-load');
        return;
      }
    }

    // Start the simulation
    studio.play();
    Logger.getInstance().log('Simulation started via play button');

  } catch (error) {
    Logger.getInstance().error('Failed to handle play button click:', error);
    throw error;
  }
}

/**
 * Determine if the play button should be enabled
 *
 * With auto-loading, the play button is always enabled if simulations are available
 *
 * @param stateManager - The state manager instance
 * @returns true if play button should be enabled
 */
export function isPlayButtonEnabled(stateManager: StateManager): boolean {
  // Always enabled - we can auto-load if needed
  return true;
}

/**
 * Update play button states based on current simulation state
 *
 * @param stateManager - The state manager instance
 * @param playButton - The play button element (with disabled property)
 * @param pauseButton - The pause button element (with disabled property)
 * @param resetButton - The reset button element (with disabled property)
 */
export function updatePlayButtonStates(
  stateManager: StateManager,
  playButton: { disabled: boolean },
  pauseButton: { disabled: boolean },
  resetButton: { disabled: boolean }
): void {
  const hasSimulation = !!stateManager.selectedSimulation.state.name?.length;

  // Play is always enabled (auto-load capability)
  playButton.disabled = false;

  // Pause/Reset only enabled when simulation is loaded
  pauseButton.disabled = !hasSimulation;
  resetButton.disabled = !hasSimulation;
}
