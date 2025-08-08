import { ISimulationPlugin } from '@core/plugin/ISimulationPlugin';
import { IWorld } from '@core/ecs/IWorld';
import { System } from '@core/ecs/System';
import { IStudio } from '../../studio/IStudio';

/**
 * Simple Physics Plugin implementing the new auto-discovery architecture
 */
export class SimplePhysicsPlugin implements ISimulationPlugin {

  getName(): string {
    return 'simple-physics';
  }

  getDependencies(): string[] {
    return [];
  }

  register(world: IWorld): void {
    // Simple physics doesn't need custom components yet
    // Register any custom components here when needed
    console.log('✅ Simple Physics plugin registered');
  }

  unregister(): void {
    console.log('✅ Simple Physics plugin unregistered');
  }

  initializeEntities(world: IWorld): void {
    // Create some simple physics entities
    console.log('🎯 Simple Physics entities initialized');
  }

  getSystems(studio: IStudio): System[] {
    // Return empty array for now - can add physics systems later
    return [];
  }
}

// Export plugin instance for auto-discovery
export default new SimplePhysicsPlugin();
