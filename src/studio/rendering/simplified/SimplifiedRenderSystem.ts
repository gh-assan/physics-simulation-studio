/**
 * 🎯 Simplified Render System
 * 
 * ECS System wrapper that connects the SimplifiedRenderManager to the ECS world.
 * Much simpler than the current RenderSystem/RenderOrchestrator complexity.
 */

import { System } from "../../../core/ecs/System";
import { IWorld } from "../../../core/ecs/IWorld";
import { ThreeGraphicsManager } from "../../graphics/ThreeGraphicsManager";
import { SimplifiedRenderManager } from "./SimplifiedRenderManager";
import { IRenderer } from "./SimplifiedInterfaces";

export class SimplifiedRenderSystem extends System {
  private renderManager: SimplifiedRenderManager;
  private lastRenderTime = 0;

  constructor(private graphicsManager: ThreeGraphicsManager) {
    super();
    
    this.renderManager = new SimplifiedRenderManager(
      graphicsManager.getScene(),
      graphicsManager.getCamera()
    );
  }

  /**
   * Register a renderer with the system
   */
  registerRenderer(renderer: IRenderer): void {
    this.renderManager.registerRenderer(renderer);
  }

  /**
   * Unregister a renderer
   */
  unregisterRenderer(name: string): void {
    this.renderManager.unregisterRenderer(name);
  }

  /**
   * Main ECS update loop
   */
  update(world: IWorld, deltaTime: number): void {
    const currentTime = performance.now();
    
    // Only render when needed
    const didRender = this.renderManager.render(world, deltaTime);
    
    if (didRender) {
      // Trigger Three.js render
      this.graphicsManager.render();
      
      const renderTime = performance.now() - currentTime;
      console.log(`🎬 Frame rendered in ${renderTime.toFixed(2)}ms`);
    }

    this.lastRenderTime = currentTime;
  }

  /**
   * Mark all renderers as dirty (force re-render)
   */
  markAllDirty(): void {
    this.renderManager.markAllDirty();
  }

  /**
   * Mark specific renderer as dirty
   */
  markDirty(rendererName: string): void {
    this.renderManager.markDirty(rendererName);
  }

  /**
   * Get debug information
   */
  getDebugInfo() {
    return {
      ...this.renderManager.getDebugInfo(),
      lastRenderTime: this.lastRenderTime
    };
  }

  /**
   * Clean up when system is removed
   */
  dispose(): void {
    this.renderManager.clearAll();
  }
}
