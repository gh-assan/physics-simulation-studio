import { System } from "../../core/ecs/System";
import { IWorld } from "../../core/ecs/IWorld";
import { ThreeGraphicsManager } from "../graphics/ThreeGraphicsManager";
import { Logger } from "../../core/utils/Logger";
import { MaterialDisposer } from "../utils/MaterialDisposer";
import * as THREE from "three";

/**
 * Centralized rendering orchestrator that manages all scene rendering and clearing
 * This replaces the scattered rendering logic across multiple systems
 */
export class RenderOrchestrator extends System {
  private graphicsManager: ThreeGraphicsManager;
  public renderers: Map<string, IRenderer> = new Map(); // Made public for plugin access
  private performanceMetrics: Map<string, number> = new Map();
  private persistentObjects: Set<string> = new Set([
    "grid", "axes", "origin", "ambientLight", "directionalLight"
  ]);
  private sceneState: SceneState = {
    entities: new Map(),
    meshes: new Map(),
    renderRequests: new Set()
  };

  constructor(graphicsManager: ThreeGraphicsManager) {
    super();
    this.graphicsManager = graphicsManager;
  }

  /**
   * Register a renderer for a specific component type or system
   */
  public registerRenderer(rendererId: string, renderer: IRenderer): void {
    this.renderers.set(rendererId, renderer);
    this.performanceMetrics.set(rendererId, 0);
    Logger.getInstance().log(`✅ Renderer '${rendererId}' registered with RenderOrchestrator`);
  }

  /**
   * Unregister a renderer
   */
  public unregisterRenderer(rendererId: string): void {
    const renderer = this.renderers.get(rendererId);
    renderer?.dispose?.();
    this.renderers.delete(rendererId);
    this.performanceMetrics.delete(rendererId);
    Logger.getInstance().log(`🗑️ Renderer '${rendererId}' unregistered from RenderOrchestrator`);
  }

  /**
   * Clear all non-persistent objects from the scene
   */
  public clearScene(): void {
    // Dispose all renderer-managed objects
    for (const [rendererId, renderer] of this.renderers) {
      if (renderer.clear) {
        renderer.clear();
      }
    }

    // Clear scene state
    this.sceneState.entities.clear();
    this.sceneState.meshes.clear();
    this.sceneState.renderRequests.clear();

    // Remove non-persistent objects from Three.js scene
    this.clearThreeScene();
  }

  /**
   * Add a persistent object that should never be cleared
   */
  public addPersistentObject(name: string): void {
    this.persistentObjects.add(name);
  }

  /**
   * Remove a persistent object (allow it to be cleared)
   */
  public removePersistentObject(name: string): void {
    this.persistentObjects.delete(name);
  }

  /**
   * Request a render on the next frame
   */
  public requestRender(): void {
    this.sceneState.renderRequests.add("default");
  }

  /**
   * Get the current scene state for debugging
   */
  public getSceneState(): SceneState {
    return {
      entities: new Map(this.sceneState.entities),
      meshes: new Map(this.sceneState.meshes),
      renderRequests: new Set(this.sceneState.renderRequests)
    };
  }

  /**
   * Check if an entity is handled by a specialized renderer
   * This prevents conflicts between different rendering systems
   */
  public isEntityHandled(entityId: number): boolean {
    return this.sceneState.entities.has(entityId);
  }

  /**
   * Get performance metrics for all renderers (in milliseconds)
   */
  public getPerformanceMetrics(): ReadonlyMap<string, number> {
    return new Map(this.performanceMetrics);
  }

  /**
   * Log performance summary for all renderers
   */
  public logPerformanceMetrics(): void {
    if (this.performanceMetrics.size === 0) {
      Logger.getInstance().log("[RenderOrchestrator] No renderers registered");
      return;
    }

    Logger.getInstance().log("[RenderOrchestrator] Performance Metrics (last frame):");
    for (const [rendererId, time] of this.performanceMetrics) {
      const formatted = time.toFixed(3);
      Logger.getInstance().log(`  ${rendererId}: ${formatted}ms`);
    }
  }

  /**
   * Main update loop - orchestrates all rendering
   */
  public update(world: IWorld, deltaTime: number): void {
    // Only render if there are active renderers or explicit requests
    const hasActiveRenderers = this.renderers.size > 0;
    const hasRenderRequests = this.sceneState.renderRequests.size > 0;

    if (!hasActiveRenderers && !hasRenderRequests) {
      // No active simulation rendering needed - keep scene static
      return;
    }

    // Update all registered renderers with performance monitoring
    for (const [rendererId, renderer] of this.renderers) {
      const startTime = performance.now();
      try {
        renderer.update(world, deltaTime);
        const endTime = performance.now();
        this.performanceMetrics.set(rendererId, endTime - startTime);
      } catch (error) {
        Logger.getInstance().error(`[RenderOrchestrator] Error in renderer ${rendererId}:`, error);
      }
    }

    // Render if requested or if any renderer has updates
    if (hasRenderRequests || this.hasRenderUpdates()) {
      this.graphicsManager.render();
      this.sceneState.renderRequests.clear();
    }
  }

  /**
   * Check if any renderer has updates requiring a render
   */
  private hasRenderUpdates(): boolean {
    // For now, always render to ensure updates are visible
    // This can be optimized later with dirty flags
    return true;
  }

  /**
   * Clear Three.js scene objects while preserving persistent ones
   */
  private clearThreeScene(): void {
    const scene = this.graphicsManager.getScene();
    const objectsToRemove: THREE.Object3D[] = [];

    scene.traverse((object) => {
      if (!this.persistentObjects.has(object.name) && object !== scene) {
        objectsToRemove.push(object);
      }
    });

    for (const object of objectsToRemove) {
      if (object.parent) {
        object.parent.remove(object);
      }
      this.disposeObject(object);
    }
  }

  /**
   * Safely dispose Three.js objects
   */
  private disposeObject(object: THREE.Object3D): void {
    try {
      // Dispose geometry
      if ((object as any).geometry && typeof (object as any).geometry.dispose === 'function') {
        (object as any).geometry.dispose();
      }

      // Dispose material(s)
      if ((object as any).material) {
        MaterialDisposer.dispose((object as any).material);
      }
    } catch (error) {
      Logger.getInstance().error('[RenderOrchestrator] Error disposing object:', error);
    }
  }

  /**
   * Get the graphics manager for renderer registration
   */
  public getGraphicsManager(): ThreeGraphicsManager {
    return this.graphicsManager;
  }

  /**
   * Dispose the orchestrator and all renderers
   */
  public dispose(): void {
    // Dispose all renderers
    for (const [rendererId, renderer] of this.renderers) {
      if (renderer.dispose) {
        renderer.dispose();
      }
    }

    this.renderers.clear();
    this.clearScene();
  }
}

/**
 * Interface that all renderers must implement
 */
export interface IRenderer {
  /**
   * Update the renderer with the current world state
   */
  update(world: IWorld, deltaTime: number): void;

  /**
   * Clear all objects managed by this renderer
   */
  clear?(): void;

  /**
   * Dispose the renderer and clean up resources
   */
  dispose?(): void;
}

/**
 * Scene state tracking for debugging and optimization
 */
export interface SceneState {
  entities: Map<number, EntityRenderInfo>;
  meshes: Map<number, THREE.Mesh>;
  renderRequests: Set<string>;
}

/**
 * Information about a rendered entity
 */
export interface EntityRenderInfo {
  entityId: number;
  componentTypes: string[];
  lastUpdate: number;
  rendererId: string;
}
