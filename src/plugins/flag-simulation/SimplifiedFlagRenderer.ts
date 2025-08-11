/**
 * SimplifiedFlagRenderer - Clean flag rendering for the simplified render system
 */

import * as THREE from "three";
import { PositionComponent } from "../../core/components/PositionComponent";
import { IWorld } from "../../core/ecs/IWorld";
import { BaseRenderer, RenderContext } from "../../studio/rendering/simplified/SimplifiedInterfaces";
import { FlagComponent } from "./FlagComponent";

export class SimplifiedFlagRenderer extends BaseRenderer {
  readonly name = "simplified-flag-renderer";
  readonly priority = 10;

  private flagMeshes = new Map<number, THREE.Mesh>();
  private flagMaterial: THREE.MeshPhongMaterial | null = null;

  constructor() {
    super();
  }

  /**
   * Check if we can render this entity
   */
  canRender(entityId: number, world: IWorld): boolean {
    const hasFlag = world.componentManager.hasComponent(entityId, FlagComponent.type);
    const hasPosition = world.componentManager.hasComponent(entityId, PositionComponent.type);

    if (hasFlag || hasPosition) {
      console.log(`🔍 Entity ${entityId}: flag=${hasFlag}, position=${hasPosition}`);
    }

    return hasFlag && hasPosition;
  }

  /**
   * Main render method - simple and direct
   */
  render(context: RenderContext): void {
    const { scene, world } = context;

    // Debug: Log render call
    console.log('🎨 SimplifiedFlagRenderer.render() called');

    // Get all flag entities efficiently
    const flagEntities = world.componentManager.getEntitiesWithComponentTypes([
      FlagComponent.type,
      PositionComponent.type
    ]);

    console.log(`🔍 Found ${flagEntities.length} flag entities with both components`);

    // Clean up deleted entities
    this.cleanupDeletedMeshes(flagEntities, scene);

    // Render each flag
    for (const entityId of flagEntities) {
      console.log(`🏁 Rendering flag entity ${entityId}`);
      this.renderFlagEntity(entityId, world, scene);
    }

    // Mark as clean after rendering
    this.markClean();
  }

  /**
   * Clean up meshes for deleted entities
   */
  private cleanupDeletedMeshes(currentEntities: number[], scene: THREE.Scene): void {
    for (const [entityId, mesh] of this.flagMeshes) {
      if (!currentEntities.includes(entityId)) {
        scene.remove(mesh);
        mesh.geometry.dispose();
        if (mesh.material instanceof THREE.Material) {
          mesh.material.dispose();
        }
        this.flagMeshes.delete(entityId);
      }
    }
  }

  /**
   * Render a single flag entity
   */
  private renderFlagEntity(entityId: number, world: IWorld, scene: THREE.Scene): void {
    const flagComponent = world.componentManager.getComponent(entityId, FlagComponent.type) as FlagComponent;
    const positionComponent = world.componentManager.getComponent(entityId, PositionComponent.type) as PositionComponent;

    if (!flagComponent || !positionComponent) return;

    // Create or update mesh
    let mesh = this.flagMeshes.get(entityId);
    if (!mesh) {
      mesh = this.createFlagMesh(flagComponent);
      this.flagMeshes.set(entityId, mesh);
      scene.add(mesh);
    }

    // Update mesh from cloth physics
    this.updateFlagMeshFromComponent(mesh, flagComponent);

    // Update position
    mesh.position.set(positionComponent.x, positionComponent.y, positionComponent.z);
  }

  /**
   * Create flag mesh from component
   */
  private createFlagMesh(flagComponent: FlagComponent): THREE.Mesh {
    console.log('🎯 Creating flag mesh with segments:', flagComponent.segmentsX, 'x', flagComponent.segmentsY);

    const geometry = new THREE.BufferGeometry();
    const material = this.getFlagMaterial();

    // Initialize geometry with vertices and indices
    this.initializeFlagGeometry(geometry, flagComponent);

    const mesh = new THREE.Mesh(geometry, material);
    console.log('✅ Flag mesh created successfully');

    return mesh;
  }

  /**
   * Get or create flag material
   */
  private getFlagMaterial(): THREE.MeshPhongMaterial {
    if (!this.flagMaterial) {
      this.flagMaterial = new THREE.MeshPhongMaterial({
        color: 0xff0000,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      });
    }
    return this.flagMaterial;
  }

  /**
   * Initialize flag geometry from component
   */
  private initializeFlagGeometry(geometry: THREE.BufferGeometry, flagComponent: FlagComponent): void {
    const vertices: number[] = [];
    const indices: number[] = [];

    // Generate vertices from flag points
    for (let y = 0; y <= flagComponent.segmentsY; y++) {
      for (let x = 0; x <= flagComponent.segmentsX; x++) {
        const idx = y * (flagComponent.segmentsX + 1) + x;
        const point = flagComponent.points[idx];
        if (point) {
          vertices.push(point.position.x, point.position.y, point.position.z);
        } else {
          // Fallback for missing points
          vertices.push(x - flagComponent.segmentsX / 2, y - flagComponent.segmentsY / 2, 0);
        }
      }
    }

    // Generate indices for triangulated quads
    for (let y = 0; y < flagComponent.segmentsY; y++) {
      for (let x = 0; x < flagComponent.segmentsX; x++) {
        const i0 = y * (flagComponent.segmentsX + 1) + x;
        const i1 = i0 + 1;
        const i2 = i0 + (flagComponent.segmentsX + 1);
        const i3 = i2 + 1;
        indices.push(i0, i2, i1, i1, i2, i3);
      }
    }

    // Set geometry attributes
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
  }

  /**
   * Update mesh geometry from flag component physics
   */
  private updateFlagMeshFromComponent(mesh: THREE.Mesh, flagComponent: FlagComponent): void {
    const geometry = mesh.geometry as THREE.BufferGeometry;
    const positions = geometry.getAttribute('position') as THREE.BufferAttribute;

    // Update vertices from physics simulation
    let vertexIndex = 0;
    for (let y = 0; y <= flagComponent.segmentsY; y++) {
      for (let x = 0; x <= flagComponent.segmentsX; x++) {
        const idx = y * (flagComponent.segmentsX + 1) + x;
        const point = flagComponent.points[idx];
        if (point) {
          positions.setXYZ(vertexIndex, point.position.x, point.position.y, point.position.z);
        }
        vertexIndex++;
      }
    }

    positions.needsUpdate = true;
    geometry.computeVertexNormals();
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    console.log('🗑️ Disposing SimplifiedFlagRenderer');

    // Dispose of all meshes
    for (const [entityId, mesh] of this.flagMeshes) {
      mesh.geometry.dispose();
      if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose();
      }
    }
    this.flagMeshes.clear();

    // Dispose of shared material
    if (this.flagMaterial) {
      this.flagMaterial.dispose();
      this.flagMaterial = null;
    }

    console.log('✅ SimplifiedFlagRenderer disposed');
  }
}
