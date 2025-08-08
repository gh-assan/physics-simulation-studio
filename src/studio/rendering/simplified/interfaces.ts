/**
 * 🎯 Simplified Rendering System - Core Interfaces
 *
 * This file defines the new unified rendering interfaces that replace
 * the complex multi-interface system with a single, clear pattern.
 */

import * as THREE from "three";
import { IWorld } from "../../../core/ecs/IWorld";

/**
 * Unified render context - everything a renderer needs
 */
export interface RenderContext {
  readonly scene: THREE.Scene;
  readonly camera: THREE.Camera;
  readonly world: IWorld;
  readonly deltaTime: number;
  readonly frameNumber: number;
}

/**
 * Single unified renderer interface - replaces IRenderable, ISimulationRenderer, etc.
 */
export interface IRenderer {
  /** Unique name for this renderer */
  readonly name: string;

  /** Priority for rendering order (lower = earlier) */
  readonly priority?: number;

  /**
   * Check if this renderer can handle a specific entity
   */
  canRender(entityId: number, world: IWorld): boolean;

  /**
   * Render all entities this renderer is responsible for
   */
  render(context: RenderContext): void;

  /**
   * Check if this renderer needs to render (dirty flag optimization)
   * If not implemented, defaults to true
   */
  needsRender?(): boolean;

  /**
   * Mark this renderer as needing a re-render
   */
  markDirty?(): void;

  /**
   * Initialize renderer resources (called once)
   */
  initialize?(): void;

  /**
   * Clean up renderer resources
   */
  dispose?(): void;
}

/**
 * Base renderer class with common functionality
 */
export abstract class BaseRenderer implements IRenderer {
  abstract readonly name: string;
  readonly priority: number = 0;

  private _isDirty = true;
  protected meshes = new Map<number, THREE.Mesh>();

  abstract canRender(entityId: number, world: IWorld): boolean;
  abstract render(context: RenderContext): void;

  needsRender(): boolean {
    return this._isDirty;
  }

  markDirty(): void {
    this._isDirty = true;
  }

  protected markClean(): void {
    this._isDirty = false;
  }

  /**
   * Helper: Get entities that this renderer can handle
   */
  protected getEntities(world: IWorld): number[] {
    const allEntities = Array.from(world.entityManager.getAllEntities());
    return allEntities.filter((id: number) => this.canRender(id, world));
  }

  /**
   * Helper: Clean up a mesh properly
   */
  protected disposeMesh(mesh: THREE.Mesh, scene: THREE.Scene): void {
    scene.remove(mesh);
    if (mesh.geometry) mesh.geometry.dispose();
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => m.dispose());
      } else {
        mesh.material.dispose();
      }
    }
  }

  dispose(): void {
    // Default cleanup - remove all managed meshes
    this.meshes.clear();
  }
}
