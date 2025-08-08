import {
  ISimulationAlgorithm,
  ISimulationState,
  EntityId
} from '../../core/simulation/interfaces';
import { FlagSystem } from './FlagSystem';

/**
 * Simple wrapper that makes FlagSystem compatible with ISimulationAlgorithm
 * This provides backward compatibility during the migration.
 */
export class FlagClothAlgorithm implements ISimulationAlgorithm {
  readonly name = "Flag Cloth Simulation";
  readonly version = "1.0.0";

  private flagSystem: FlagSystem;
  private world: any = null;

  constructor() {
    this.flagSystem = new FlagSystem();
  }

  /**
   * Execute one simulation step
   */
  step(state: ISimulationState, deltaTime: number): ISimulationState {
    if (!this.world) {
      return state;
    }

    // Delegate to the existing FlagSystem
    this.flagSystem.update(this.world, deltaTime);

    // Return the same state (the system modifies entities directly)
    return state;
  }

  /**
   * Configure algorithm parameters
   */
  configure(parameters: Record<string, any>): void {
    // For now, just log the parameters
    // In a full implementation, we'd update the flag physics parameters
    console.log('⚙️ Flag algorithm parameters updated:', parameters);
  }

  /**
   * Get current algorithm parameters
   */
  getParameters(): Record<string, any> {
    return {
      stiffness: 0.8,
      damping: 0.99,
      windStrength: 0.1,
      windDirection: { x: 1, y: 0, z: 0 },
      gravity: { x: 0, y: -9.81, z: 0 }
    };
  }

  /**
   * Validate parameter values
   */
  validateParameter(paramName: string, value: any): true | string {
    switch (paramName) {
      case 'stiffness':
        return (typeof value === 'number' && value >= 0.1 && value <= 1.0)
          ? true : 'Stiffness must be between 0.1 and 1.0';
      case 'windStrength':
        return (typeof value === 'number' && value >= 0 && value <= 2.0)
          ? true : 'Wind strength must be between 0 and 2.0';
      default:
        return true;
    }
  }

  /**
   * Initialize algorithm with entities
   */
  initialize(entities: EntityId[]): void {
    console.log(`🎌 Flag algorithm initialized with ${entities.length} entities`);
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.world = null;
    console.log('🗑️ Flag algorithm disposed');
  }

  /**
   * Set world reference (backward compatibility)
   */
  setWorld(world: any): void {
    this.world = world;
    if (this.flagSystem && 'init' in this.flagSystem) {
      this.flagSystem.init();
    }
  }
}
