/**
 * 🎌 Simplified Flag Renderer
 *
 * Auto-discovers and integrates with SimplifiedRenderSystem.
 * Much cleaner than the old FlagRenderSystem complexity!
 */

import * as THREE from 'three';
import { IRenderer, RenderContext } from '../../../studio/rendering/simplified/SimplifiedInterfaces';
import { IWorld } from '../../../core/ecs/IWorld';
import { FlagComponent } from '../FlagComponent';
import { PositionComponent } from '../../../core/components/PositionComponent';

export class SimplifiedFlagRenderer implements IRenderer {
  readonly name = 'simplified-flag-renderer';

  private flagMeshes = new Map<number, THREE.Group>();

  /**
   * Initialize the renderer (called automatically by SimplifiedRenderManager)
   */
  initialize?(): void {
    console.log('🎌 SimplifiedFlagRenderer initialized');
  }

  /**
   * Check if this renderer can handle the entity
   */
  canRender(entityId: number, world: IWorld): boolean {
    return world.componentManager.hasComponent(entityId, 'FlagComponent');
  }

  /**
   * Render all flag entities
   */
  render(context: RenderContext): void {
    const { scene, world, deltaTime } = context;

    // Get all flag entities using component type strings
    const flagEntities = world.componentManager.getEntitiesWithComponentTypes(['FlagComponent', 'PositionComponent']);

    // Create/update flag meshes
    for (const entityId of flagEntities) {
      const flagComponent = world.componentManager.getComponent(entityId, 'FlagComponent') as FlagComponent;
      const positionComponent = world.componentManager.getComponent(entityId, 'PositionComponent') as PositionComponent;

      if (!flagComponent || !positionComponent) continue;

      if (!this.flagMeshes.has(entityId)) {
        // Create new flag visual
        const flagGroup = this.createFlagVisual(flagComponent, positionComponent);
        this.flagMeshes.set(entityId, flagGroup);
        scene.add(flagGroup);
      } else {
        // Update existing flag
        const flagGroup = this.flagMeshes.get(entityId)!;
        this.updateFlagVisual(flagGroup, flagComponent, positionComponent, deltaTime);
      }
    }

    // Remove deleted entities
    const activeEntityIds = new Set(flagEntities);
    for (const [entityId, flagGroup] of this.flagMeshes) {
      if (!activeEntityIds.has(entityId)) {
        scene.remove(flagGroup);
        this.disposeFlagVisual(flagGroup);
        this.flagMeshes.delete(entityId);
      }
    }
  }

  /**
   * Create the visual representation of a flag
   */
  private createFlagVisual(flagComponent: FlagComponent, positionComponent: PositionComponent): THREE.Group {
    const flagGroup = new THREE.Group();
    flagGroup.name = `flag-entity-${flagComponent.type}`;

    // Create flag pole (default height)
    const poleHeight = 8;
    const poleGeometry = new THREE.CylinderGeometry(0.05, 0.05, poleHeight);
    const poleMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Brown
    const poleMesh = new THREE.Mesh(poleGeometry, poleMaterial);
    poleMesh.name = 'flag-pole';
    poleMesh.position.y = poleHeight / 2;
    flagGroup.add(poleMesh);

    // Create flag cloth using actual FlagComponent properties
    const flagGeometry = new THREE.PlaneGeometry(flagComponent.width, flagComponent.height);
    const flagMaterial = new THREE.MeshLambertMaterial({
      color: 0x1f77b4, // Default blue
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    const flagMesh = new THREE.Mesh(flagGeometry, flagMaterial);
    flagMesh.name = 'flag-cloth';
    flagMesh.position.set(
      flagComponent.width / 2,
      poleHeight - flagComponent.height / 2,
      0
    );
    flagGroup.add(flagMesh);

    // Position the entire group
    flagGroup.position.set(
      positionComponent.x,
      positionComponent.y,
      positionComponent.z
    );

    console.log(`🎌 Created flag visual for entity at (${positionComponent.x}, ${positionComponent.y}, ${positionComponent.z})`);

    return flagGroup;
  }

  /**
   * Update flag animation and position
   */
  private updateFlagVisual(
    flagGroup: THREE.Group,
    flagComponent: FlagComponent,
    positionComponent: PositionComponent,
    deltaTime: number
  ): void {
    // Update position
    flagGroup.position.set(
      positionComponent.x,
      positionComponent.y,
      positionComponent.z
    );

    // Simple flag waving animation based on wind
    const flagCloth = flagGroup.getObjectByName('flag-cloth') as THREE.Mesh;
    if (flagCloth && flagComponent.windStrength > 0) {
      const time = Date.now() * 0.001;
      flagCloth.rotation.z = Math.sin(time * 2) * 0.1 * flagComponent.windStrength; // Wave based on wind strength
    }
  }

  /**
   * Clean up flag visual resources
   */
  private disposeFlagVisual(flagGroup: THREE.Group): void {
    flagGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) {
          child.geometry.dispose();
        }
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => mat.dispose());
        } else if (child.material) {
          child.material.dispose();
        }
      }
    });
  }

  /**
   * Cleanup when renderer is removed
   */
  dispose(scene?: THREE.Scene): void {
    console.log('🗑️ Disposing SimplifiedFlagRenderer');

    // Remove objects from scene first, then dispose resources
    for (const [_, flagGroup] of this.flagMeshes) {
      if (scene) {
        scene.remove(flagGroup);
      }
      this.disposeFlagVisual(flagGroup);
    }

    this.flagMeshes.clear();
    console.log('✅ SimplifiedFlagRenderer disposed');
  }
}
