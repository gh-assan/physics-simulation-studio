/**
 * 🎯 Simplified Flag Renderer Example
 *
 * This shows how to convert the complex FlagRenderer to the new simple pattern.
 * Much cleaner, easier to understand, and more reliable.
 */

import * as THREE from "three";
import { BaseRenderer, RenderContext } from "./SimplifiedInterfaces";
import { IWorld } from "../../../core/ecs/IWorld";
import { FlagComponent } from "../../../plugins/flag-simulation/FlagComponent";
import { PositionComponent } from "../../../core/components/PositionComponent";
import { RotationComponent } from "../../../core/ecs/RotationComponent";

export class SimplifiedFlagRenderer extends BaseRenderer {
  readonly name = "flag-renderer";
  readonly priority = 10;

  private flagMeshes = new Map<number, THREE.Mesh>();

  /**
   * Check if we can render this entity
   */
  canRender(entityId: number, world: IWorld): boolean {
    return world.componentManager.hasComponent(entityId, FlagComponent.type) &&
           world.componentManager.hasComponent(entityId, PositionComponent.type);
  }

  /**
   * Main render method - simple and direct
   */
  render(context: RenderContext): void {
    const { scene, world } = context;

    // Get all flag entities efficiently
    const flagEntities = world.componentManager.getEntitiesWithComponentTypes([
      FlagComponent.type,
      PositionComponent.type
    ]);

    // Clean up deleted entities
    this.cleanupDeletedMeshes(flagEntities, scene);

    // Render each flag
    for (const entityId of flagEntities) {
      this.renderFlagEntity(entityId, world, scene);
    }

    // Mark as clean after rendering
    this.markClean();
  }

  /**
   * Render a single flag entity
   */
  private renderFlagEntity(entityId: number, world: IWorld, scene: THREE.Scene): void {
    const flag = world.componentManager.getComponent(entityId, FlagComponent.type) as FlagComponent;
    const position = world.componentManager.getComponent(entityId, PositionComponent.type) as PositionComponent;
    const rotation = world.componentManager.getComponent(entityId, RotationComponent.name) as RotationComponent;

    if (!flag || !position) return;

    // Get or create mesh
    let mesh = this.flagMeshes.get(entityId);
    if (!mesh) {
      mesh = this.createFlagMesh(flag);
      scene.add(mesh);
      this.flagMeshes.set(entityId, mesh);
    }

    // Update mesh
    this.updateFlagMesh(mesh, flag, position, rotation);
  }

  /**
   * Create flag mesh geometry
   */
  private createFlagMesh(flag: FlagComponent): THREE.Mesh {
    const geometry = new THREE.BufferGeometry();

    // Create vertex arrays
    const positions = new Float32Array(flag.points.length * 3);
    const indices: number[] = [];

    // Generate vertices
    flag.points.forEach((point, i) => {
      positions[i * 3] = point.position.x;
      positions[i * 3 + 1] = point.position.y;
      positions[i * 3 + 2] = point.position.z;
    });

    // Generate triangular faces
    for (let y = 0; y < flag.segmentsY; y++) {
      for (let x = 0; x < flag.segmentsX; x++) {
        const i0 = y * (flag.segmentsX + 1) + x;
        const i1 = i0 + 1;
        const i2 = i0 + (flag.segmentsX + 1);
        const i3 = i2 + 1;
        indices.push(i0, i2, i1, i1, i2, i3);
      }
    }

    // Set geometry attributes
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    // Create material
    const material = new THREE.MeshLambertMaterial({
      color: 0xff0000,
      side: THREE.DoubleSide
    });

    return new THREE.Mesh(geometry, material);
  }

  /**
   * Update flag mesh with current physics state
   */
  private updateFlagMesh(
    mesh: THREE.Mesh,
    flag: FlagComponent,
    position: PositionComponent,
    rotation?: RotationComponent
  ): void {
    // Update geometry positions
    const positions = mesh.geometry.attributes.position.array as Float32Array;
    flag.points.forEach((point, i) => {
      const offset = i * 3;
      positions[offset] = point.position.x;
      positions[offset + 1] = point.position.y;
      positions[offset + 2] = point.position.z;
    });

    mesh.geometry.attributes.position.needsUpdate = true;
    mesh.geometry.computeVertexNormals();

    // Update transform
    mesh.position.set(position.x, position.y, position.z);
    if (rotation) {
      mesh.rotation.setFromQuaternion(new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w));
    }
  }

  /**
   * Clean up meshes for deleted entities
   */
  private cleanupDeletedMeshes(activeEntities: number[], scene: THREE.Scene): void {
    const activeSet = new Set(activeEntities);

    for (const [entityId, mesh] of this.flagMeshes) {
      if (!activeSet.has(entityId)) {
        this.disposeMesh(mesh, scene);
        this.flagMeshes.delete(entityId);
      }
    }
  }

  /**
   * Clean up all resources
   */
  dispose(): void {
    // Dispose all flag meshes
    for (const [entityId, mesh] of this.flagMeshes) {
      mesh.geometry.dispose();
      if (mesh.material) {
        (mesh.material as THREE.Material).dispose();
      }
    }

    this.flagMeshes.clear();
    super.dispose();
  }
}
