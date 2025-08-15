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
import * as THREE from 'three';

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
   * Get the graphics manager (for compatibility)
   */
  getGraphicsManager(): ThreeGraphicsManager {
    return this.graphicsManager;
  }

  /**
   * Get the scene for clean slate operations
   */
  getScene(): THREE.Scene {
    return this.graphicsManager.getScene();
  }

  /**
   * Main ECS update loop
   */
  update(world: IWorld, deltaTime: number): void {
    const currentTime = performance.now();

    console.log('🎬 SimplifiedRenderSystem.update() called'); // DEBUG: Confirm system is called

    // Only render when needed
    const didRender = this.renderManager.render(world, deltaTime);

    if (didRender) {
      // Trigger Three.js render
      this.graphicsManager.render();

      const renderTime = performance.now() - currentTime;
      console.log(`🎬 Frame rendered in ${renderTime.toFixed(2)}ms`);
    } else {
      console.log('🎬 No rendering needed - no active renderers or no changes'); // DEBUG: Why no render
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
