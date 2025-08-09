/**
 * 🎯 Simplified Water Renderer
 *
 * Converts the old WaterRenderer to the new simplified pattern.
 * Clean, efficient, and easy to understand.
 */

import * as THREE from "three";
import { BaseRenderer, RenderContext } from "../../studio/rendering/simplified/SimplifiedInterfaces";
import { IWorld } from "../../core/ecs/IWorld";
import { WaterBodyComponent, WaterDropletComponent } from "./WaterComponents";
import { PositionComponent } from "../../core/components/PositionComponent";

export class SimplifiedWaterRenderer extends BaseRenderer {
  readonly name = "water-renderer";
  readonly priority = 5;

  private waterMesh?: THREE.Mesh;
  private rippleMeshes: THREE.Mesh[] = [];
  private dropletMeshes = new Map<number, THREE.Mesh>();

  /**
   * Check if we can render this entity
   */
  canRender(entityId: number, world: IWorld): boolean {
    return world.componentManager.hasComponent(entityId, WaterBodyComponent.type) ||
           world.componentManager.hasComponent(entityId, WaterDropletComponent.type);
  }

  /**
   * Main render method
   */
  render(context: RenderContext): void {
    const { scene, world } = context;

    // Render water bodies
    this.renderWaterBodies(world, scene);

    // Render water droplets
    this.renderWaterDroplets(world, scene);

    // Mark as clean after rendering
    this.markClean();
  }

  /**
   * Render water bodies with ripples
   */
  private renderWaterBodies(world: IWorld, scene: THREE.Scene): void {
    const waterEntities = world.componentManager.getEntitiesWithComponentTypes([
      WaterBodyComponent.type,
      PositionComponent.type
    ]);

    for (const entityId of waterEntities) {
      const waterBody = world.componentManager.getComponent(entityId, WaterBodyComponent.type) as WaterBodyComponent;
      const position = world.componentManager.getComponent(entityId, PositionComponent.type) as PositionComponent;

      if (!waterBody || !position) continue;

      // Create or update water mesh
      if (!this.waterMesh) {
        this.waterMesh = this.createWaterMesh(waterBody);
        scene.add(this.waterMesh);
      }

      // Update water position
      this.waterMesh.position.set(position.x, position.y, position.z);
      this.waterMesh.rotation.x = -Math.PI / 2;

      // Update ripples
      this.updateRipples(waterBody, scene);
    }
  }

  /**
   * Render water droplets
   */
  private renderWaterDroplets(world: IWorld, scene: THREE.Scene): void {
    const dropletEntities = world.componentManager.getEntitiesWithComponentTypes([
      WaterDropletComponent.type,
      PositionComponent.type
    ]);

    // Clean up deleted droplets
    this.cleanupDroplets(dropletEntities, scene);

    // Render active droplets
    for (const entityId of dropletEntities) {
      const droplet = world.componentManager.getComponent(entityId, WaterDropletComponent.type) as WaterDropletComponent;
      const position = world.componentManager.getComponent(entityId, PositionComponent.type) as PositionComponent;

      if (!droplet || !position) continue;

      let mesh = this.dropletMeshes.get(entityId);
      if (!mesh) {
        mesh = this.createDropletMesh(droplet);
        scene.add(mesh);
        this.dropletMeshes.set(entityId, mesh);
      }

      // Update droplet position
      mesh.position.set(position.x, position.y, position.z);

      // Update droplet scale based on size
      const scale = droplet.radius.value || 0.1;
      mesh.scale.setScalar(scale);
    }
  }

  /**
   * Create water surface mesh
   */
  private createWaterMesh(waterBody: WaterBodyComponent): THREE.Mesh {
    // Use reasonable defaults since WaterBodyComponent doesn't have width/height
    const width = 10;
    const height = 10;

    const geometry = new THREE.PlaneGeometry(width, height, 32, 32);
    const material = new THREE.MeshLambertMaterial({
      color: 0x006699,
      transparent: true,
      opacity: 0.8
    });

    return new THREE.Mesh(geometry, material);
  }

  /**
   * Create water droplet mesh
   */
  private createDropletMesh(droplet: WaterDropletComponent): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(0.1, 8, 6);
    const material = new THREE.MeshLambertMaterial({
      color: 0x4FC3F7,
      transparent: true,
      opacity: 0.8
    });

    return new THREE.Mesh(geometry, material);
  }

  /**
   * Update water ripples
   */
  private updateRipples(waterBody: WaterBodyComponent, scene: THREE.Scene): void {
    // Clean up old ripples
    for (const ripple of this.rippleMeshes) {
      scene.remove(ripple);
      ripple.geometry.dispose();
      (ripple.material as THREE.Material).dispose();
    }
    this.rippleMeshes = [];

    // Create new ripples
    if (waterBody.ripples) {
      for (const ripple of waterBody.ripples) {
        const rippleMesh = this.createRippleMesh(ripple);
        rippleMesh.position.set(ripple.x, 0, ripple.z); // Use x, z from Ripple interface
        scene.add(rippleMesh);
        this.rippleMeshes.push(rippleMesh);
      }
    }
  }

  /**
   * Create ripple effect mesh
   */
  private createRippleMesh(ripple: any): THREE.Mesh {
    const geometry = new THREE.RingGeometry(ripple.radius - 0.05, ripple.radius, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x90caf9,
      transparent: true,
      opacity: Math.max(0, ripple.amplitude || 0.5)
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    return mesh;
  }

  /**
   * Clean up deleted droplets
   */
  private cleanupDroplets(activeEntities: number[], scene: THREE.Scene): void {
    const activeSet = new Set(activeEntities);

    for (const [entityId, mesh] of this.dropletMeshes) {
      if (!activeSet.has(entityId)) {
        this.disposeMesh(mesh, scene);
        this.dropletMeshes.delete(entityId);
      }
    }
  }

  /**
   * Clean up all resources
   */
  dispose(): void {
    // Dispose water mesh
    if (this.waterMesh) {
      if (this.waterMesh.geometry) this.waterMesh.geometry.dispose();
      if (this.waterMesh.material) (this.waterMesh.material as THREE.Material).dispose();
    }

    // Dispose ripple meshes
    for (const ripple of this.rippleMeshes) {
      if (ripple.geometry) ripple.geometry.dispose();
      if (ripple.material) (ripple.material as THREE.Material).dispose();
    }

    // Dispose droplet meshes
    for (const [entityId, mesh] of this.dropletMeshes) {
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) (mesh.material as THREE.Material).dispose();
    }

    this.dropletMeshes.clear();
    this.rippleMeshes = [];
    super.dispose();
  }
}
