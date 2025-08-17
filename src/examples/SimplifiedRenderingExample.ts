/**
 * 🔧 Studio Integration Example - Simplified Rendering
 * 
 * This shows how to integrate the simplified rendering system with Studio:
 * - Single RenderSystem in ECS world
 * - Direct renderer registration  
 * - No complex abstractions
 */

import { IWorld } from '../../core/ecs/IWorld';
import { ThreeGraphicsManager } from '../../studio/graphics/ThreeGraphicsManager';
import { RenderSystem } from '../../studio/rendering/RenderSystem';
import { Studio } from '../../studio/Studio';
import { DirectFlagRenderer } from '../flag-simulation/DirectFlagRenderer';

/**
 * Example: How to set up simplified rendering in Studio
 */
export class SimplifiedStudioSetup {

  static setupRendering(studio: Studio, world: IWorld, graphicsManager: ThreeGraphicsManager): void {
    console.log('🎯 Setting up simplified rendering system...');

    // Create single render system with direct scene access
    const renderSystem = new RenderSystem(graphicsManager.getScene());

    // Add render system to ECS world
    world.systemManager.addSystem(renderSystem);

    // Register renderers directly
    renderSystem.registerRenderer(new DirectFlagRenderer());

    // Future renderers would be added here:
    // renderSystem.registerRenderer(new DirectWaterRenderer());
    // renderSystem.registerRenderer(new DirectParticleRenderer());

    console.log('✅ Simplified rendering system ready');
    console.log('📊 Debug info:', renderSystem.getDebugInfo());
  }

  /**
   * Example: How a plugin would register its renderer
   */
  static examplePluginRegistration(world: IWorld): void {
    // Get the render system from ECS world
    const renderSystem = world.systemManager.getSystem(RenderSystem);

    if (renderSystem) {
      // Register plugin's renderer
      renderSystem.registerRenderer(new DirectFlagRenderer());
      console.log('🔌 Plugin renderer registered');
    } else {
      console.error('❌ RenderSystem not found in world');
    }
  }

  /**
   * Example: How to debug rendering issues
   */
  static debugRendering(world: IWorld): void {
    const renderSystem = world.systemManager.getSystem(RenderSystem);

    if (renderSystem) {
      const debugInfo = renderSystem.getDebugInfo();
      console.log('🔍 Rendering Debug Info:');
      console.log(`  - Total renderers: ${debugInfo.rendererCount}`);
      console.log('  - Renderer list:');

      debugInfo.renderers.forEach(renderer => {
        console.log(`    * ${renderer.name} (priority: ${renderer.priority})`);
      });
    }
  }
}

/**
 * Example: Plugin implementation with simplified rendering
 */
export class ExampleFlagPlugin {

  initialize(world: IWorld): void {
    console.log('🏁 Initializing flag plugin...');

    // Add flag physics system
    // world.systemManager.addSystem(new FlagSystem());

    // Register flag renderer
    const renderSystem = world.systemManager.getSystem(RenderSystem);
    if (renderSystem) {
      renderSystem.registerRenderer(new DirectFlagRenderer());
      console.log('✅ Flag renderer registered');
    }
  }

  dispose(world: IWorld): void {
    console.log('🗑️ Disposing flag plugin...');

    // Unregister renderer
    const renderSystem = world.systemManager.getSystem(RenderSystem);
    if (renderSystem) {
      renderSystem.unregisterRenderer('direct-flag-renderer');
      console.log('✅ Flag renderer unregistered');
    }
  }
}
