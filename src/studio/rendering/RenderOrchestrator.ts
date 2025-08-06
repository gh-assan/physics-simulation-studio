import { System } from "../../core/ecs/System";
import { IWorld } from "../../core/ecs/IWorld";
import { ThreeGraphicsManager } from "../graphics/ThreeGraphicsManager";
import { Logger } from "../../core/utils/Logger";
import * as THREE from "three";

/**
 * Centralized rendering orchestrator that manages all scene rendering and clearing
 * This replaces the scattered rendering logic across multiple systems
 */
export class RenderOrchestrator extends System {
  private graphicsManager: ThreeGraphicsManager;
  private renderers: Map<string, IRenderer> = new Map();
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
  }

  /**
   * Unregister a renderer
   */
  public unregisterRenderer(rendererId: string): void {
    const renderer = this.renderers.get(rendererId);
    if (renderer && renderer.dispose) {
      renderer.dispose();
    }
    this.renderers.delete(rendererId);
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

    // Update all registered renderers
    for (const [rendererId, renderer] of this.renderers) {
      try {
        renderer.update(world, deltaTime);
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
        if (Array.isArray((object as any).material)) {
          (object as any).material.forEach((mat: any) => {
            if (mat && typeof mat.dispose === 'function') {
              mat.dispose();
            }
          });
        } else if (typeof (object as any).material.dispose === 'function') {
          (object as any).material.dispose();
        }
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
