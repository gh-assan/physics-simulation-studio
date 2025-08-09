import {
  IEnhancedSimulationPlugin,
  ISimulationAlgorithm,
  ISimulationRenderer
} from '../../core/plugin/EnhancedPluginInterfaces';
import { RigidBodyAlgorithm } from './RigidBodyAlgorithm';
import { RigidBodyRenderer } from './RigidBodyRenderer';

/**
 * Enhanced Rigid Body Physics Plugin with Clean Architecture
 * Implements rigid body dynamics with collision detection
 */
export class RigidBodyCleanPlugin implements IEnhancedSimulationPlugin {
  private algorithm: RigidBodyAlgorithm;
  private renderer: RigidBodyRenderer;

  constructor() {
    this.algorithm = new RigidBodyAlgorithm();
    this.renderer = new RigidBodyRenderer();
  }

  getName(): string {
    return 'rigid-body-clean';
  }

  getDependencies(): string[] {
    return ['three', 'physics']; // Note: could use Rapier in the future
  }

  getAlgorithm(): ISimulationAlgorithm {
    return this.algorithm;
  }

  getRenderer(): ISimulationRenderer {
    return this.renderer;
  }

  /**
   * Get the algorithm instance for direct access if needed
   */
  getRigidBodyAlgorithm(): RigidBodyAlgorithm {
    return this.algorithm;
  }

  /**
   * Get the renderer instance for direct access if needed
   */
  getRigidBodyRenderer(): RigidBodyRenderer {
    return this.renderer;
  }
}
