/**
 * 🎯 Simplified Render Manager
 * 
 * Single point of truth for all rendering. Replaces the complex
 * orchestrator pattern with a simple, efficient system.
 */

import * as THREE from "three";
import { IWorld } from "../../../core/ecs/IWorld";
import { IRenderer, RenderContext } from "./SimplifiedInterfaces";

/**
 * Simple, efficient render manager
 */
export class SimplifiedRenderManager {
  private renderers = new Map<string, IRenderer>();
  private dirtyRenderers = new Set<string>();
  private frameNumber = 0;

  constructor(
    private scene: THREE.Scene,
    private camera: THREE.Camera
  ) {}

  /**
   * Register a renderer
   */
  registerRenderer(renderer: IRenderer): void {
    console.log(`📝 Registering renderer: ${renderer.name}`);
    
    this.renderers.set(renderer.name, renderer);
    this.markDirty(renderer.name);
    
    // Initialize if needed
    if (renderer.initialize) {
      renderer.initialize();
    }
  }

  /**
   * Unregister a renderer
   */
  unregisterRenderer(name: string): void {
    console.log(`🗑️ Unregistering renderer: ${name}`);
    
    const renderer = this.renderers.get(name);
    if (renderer?.dispose) {
      renderer.dispose();
    }
    
    this.renderers.delete(name);
    this.dirtyRenderers.delete(name);
  }

  /**
   * Mark a renderer as dirty (needs re-render)
   */
  markDirty(rendererName: string): void {
    if (this.renderers.has(rendererName)) {
      this.dirtyRenderers.add(rendererName);
      
      // Also mark the renderer itself if it supports it
      const renderer = this.renderers.get(rendererName);
      if (renderer?.markDirty) {
        renderer.markDirty();
      }
    }
  }

  /**
   * Mark all renderers as dirty
   */
  markAllDirty(): void {
    for (const name of this.renderers.keys()) {
      this.markDirty(name);
    }
  }

  /**
   * Main render method - only renders what's dirty
   */
  render(world: IWorld, deltaTime: number): boolean {
    this.frameNumber++;
    
    const context: RenderContext = {
      scene: this.scene,
      camera: this.camera,
      world,
      deltaTime,
      frameNumber: this.frameNumber
    };

    let didRender = false;
    const sortedRenderers = this.getSortedRenderers();

    for (const renderer of sortedRenderers) {
      const needsRender = this.shouldRenderRenderer(renderer);
      
      if (needsRender) {
        try {
          const startTime = performance.now();
          renderer.render(context);
          const endTime = performance.now();
          
          console.log(`🎨 ${renderer.name}: ${(endTime - startTime).toFixed(2)}ms`);
          didRender = true;
        } catch (error) {
          console.error(`❌ Renderer error (${renderer.name}):`, error);
        }
      }
    }

    // Clear dirty flags after successful render
    if (didRender) {
      this.dirtyRenderers.clear();
    }

    return didRender;
  }

  /**
   * Get sorted renderers by priority
   */
  private getSortedRenderers(): IRenderer[] {
    return Array.from(this.renderers.values())
      .sort((a, b) => (a.priority || 0) - (b.priority || 0));
  }

  /**
   * Check if a renderer should render this frame
   */
  private shouldRenderRenderer(renderer: IRenderer): boolean {
    // Always render if marked dirty
    if (this.dirtyRenderers.has(renderer.name)) {
      return true;
    }

    // Use renderer's own dirty flag if available
    if (renderer.needsRender) {
      return renderer.needsRender();
    }

    // Default: don't render if not dirty
    return false;
  }

  /**
   * Clear all renderers
   */
  clearAll(): void {
    console.log('🧹 Clearing all renderers');
    
    for (const renderer of this.renderers.values()) {
      if (renderer.dispose) {
        renderer.dispose();
      }
    }
    
    this.renderers.clear();
    this.dirtyRenderers.clear();
  }

  /**
   * Get debug info
   */
  getDebugInfo(): {
    rendererCount: number;
    dirtyCount: number;
    frameNumber: number;
    renderers: string[];
  } {
    return {
      rendererCount: this.renderers.size,
      dirtyCount: this.dirtyRenderers.size,
      frameNumber: this.frameNumber,
      renderers: Array.from(this.renderers.keys())
    };
  }
}
