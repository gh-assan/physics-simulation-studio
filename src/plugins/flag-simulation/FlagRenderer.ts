import {
  ISimulationRenderer,
  IRenderContext,
  EntityId
} from '../../core/simulation/interfaces';
import { FlagComponent } from './FlagComponent';
import { PositionComponent } from '../../core/components/PositionComponent';
import { World } from '../../core/ecs/World';
import * as THREE from 'three';

/**
 * Flag Renderer - Cloth Mesh Visualization
 *
 * Renders flag cloth using Three.js geometry, creating dynamic mesh
 * that updates with physics simulation results.
 */
export class FlagRenderer implements ISimulationRenderer {
  readonly algorithmName = "Flag Cloth Simulation";
  readonly rendererType = "cloth-mesh";
  readonly priority = 1;

  private world: World | null = null;
  private flagMeshes: Map<EntityId, THREE.Mesh> = new Map();
  private poleMeshes: Map<EntityId, THREE.Mesh> = new Map();

  private visualParameters = {
    flagColor: '#ff0000',
    flagOpacity: 0.8,
    showWireframe: false,
    poleColor: '#8B4513',
    poleOpacity: 1.0,
    doubleSided: true
  };

  /**
   * Check if this renderer can handle the given entity
   */
  canRender(entities: EntityId[]): boolean {
    if (!this.world) return false;

    return entities.some(entityId => {
      const hasFlag = this.world!.componentManager.hasComponent(entityId, FlagComponent.type);
      const hasPosition = this.world!.componentManager.hasComponent(entityId, PositionComponent.type);
      return hasFlag && hasPosition;
    });
  }

  /**
   * Render entities based on current state
   */
  render(entities: EntityId[], context: IRenderContext): void {
    if (!this.world || !context.scene) {
      return;
    }

    for (const entityId of entities) {
      if (this.canRenderEntity(entityId)) {
        this.renderFlagEntity(entityId, context);
      }
    }
  }

  /**
   * Update visual parameters only (no simulation impact)
   */
  updateVisualParameters(parameters: Record<string, any>): void {
    let needsUpdate = false;

    if (parameters.flagColor !== undefined) {
      this.visualParameters.flagColor = parameters.flagColor;
      needsUpdate = true;
    }

    if (parameters.flagOpacity !== undefined) {
      this.visualParameters.flagOpacity = Math.max(0, Math.min(1, parameters.flagOpacity));
      needsUpdate = true;
    }

    if (parameters.showWireframe !== undefined) {
      this.visualParameters.showWireframe = parameters.showWireframe;
      needsUpdate = true;
    }

    if (parameters.poleColor !== undefined) {
      this.visualParameters.poleColor = parameters.poleColor;
      needsUpdate = true;
    }

    if (parameters.doubleSided !== undefined) {
      this.visualParameters.doubleSided = parameters.doubleSided;
      needsUpdate = true;
    }

    if (needsUpdate) {
      this.updateExistingMeshes();
    }

    console.log('🎨 Flag renderer visual parameters updated:', parameters);
  }

  /**
   * Clear all rendered objects
   */
  clear(): void {
    // Remove all flag meshes from scene
    this.flagMeshes.forEach((mesh, entityId) => {
      mesh.parent?.remove(mesh);
      this.disposeMesh(mesh);
    });

    // Remove all pole meshes from scene
    this.poleMeshes.forEach((mesh, entityId) => {
      mesh.parent?.remove(mesh);
      this.disposeMesh(mesh);
    });

    this.flagMeshes.clear();
    this.poleMeshes.clear();

    console.log('🧹 Flag renderer cleared');
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.clear();
    this.world = null;
    console.log('🗑️ Flag renderer disposed');
  }

  /**
   * Set world reference for ECS access
   */
  setWorld(world: World): void {
    this.world = world;
  }

  // Private methods

  private canRenderEntity(entityId: EntityId): boolean {
    if (!this.world) return false;

    const hasFlag = this.world.componentManager.hasComponent(entityId, FlagComponent.type);
    const hasPosition = this.world.componentManager.hasComponent(entityId, PositionComponent.type);

    return hasFlag && hasPosition;
  }

  private renderFlagEntity(entityId: EntityId, context: IRenderContext): void {
    if (!this.world) return;

    const flagComponent = this.world.componentManager.getComponent(
      entityId,
      FlagComponent.type
    ) as FlagComponent;

    if (!flagComponent || !flagComponent.points || flagComponent.points.length === 0) {
      return;
    }

    // Create or update flag mesh
    let flagMesh = this.flagMeshes.get(entityId);
    if (!flagMesh) {
      flagMesh = this.createFlagMesh(flagComponent);
      this.flagMeshes.set(entityId, flagMesh);
      context.scene.add(flagMesh);
    } else {
      this.updateFlagMesh(flagMesh, flagComponent);
    }

    // Render pole if attached
    if (flagComponent.poleEntityId) {
      this.renderPoleEntity(flagComponent.poleEntityId, context);
    }
  }

  private createFlagMesh(flagComponent: FlagComponent): THREE.Mesh {
    const geometry = this.createFlagGeometry(flagComponent);
    const material = this.createFlagMaterial();

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
  }

  private createFlagGeometry(flagComponent: FlagComponent): THREE.BufferGeometry {
    const numRows = flagComponent.segmentsY + 1;
    const numCols = flagComponent.segmentsX + 1;

    // Create positions array
    const positions = new Float32Array(numRows * numCols * 3);

    // Create indices for triangles
    const indices: number[] = [];

    // Fill positions from flag points
    for (let y = 0; y < numRows; y++) {
      for (let x = 0; x < numCols; x++) {
        const index = y * numCols + x;
        const point = flagComponent.points[index];

        positions[index * 3] = point.position.x;
        positions[index * 3 + 1] = point.position.y;
        positions[index * 3 + 2] = point.position.z;
      }
    }

    // Create triangle indices
    for (let y = 0; y < numRows - 1; y++) {
      for (let x = 0; x < numCols - 1; x++) {
        const topLeft = y * numCols + x;
        const topRight = topLeft + 1;
        const bottomLeft = (y + 1) * numCols + x;
        const bottomRight = bottomLeft + 1;

        // First triangle
        indices.push(topLeft, bottomLeft, topRight);
        // Second triangle
        indices.push(topRight, bottomLeft, bottomRight);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
  }

  private createFlagMaterial(): THREE.MeshLambertMaterial {
    return new THREE.MeshLambertMaterial({
      color: this.visualParameters.flagColor,
      opacity: this.visualParameters.flagOpacity,
      transparent: this.visualParameters.flagOpacity < 1.0,
      wireframe: this.visualParameters.showWireframe,
      side: this.visualParameters.doubleSided ? THREE.DoubleSide : THREE.FrontSide
    });
  }

  private updateFlagMesh(mesh: THREE.Mesh, flagComponent: FlagComponent): void {
    const geometry = mesh.geometry as THREE.BufferGeometry;
    const positionAttribute = geometry.getAttribute('position') as THREE.BufferAttribute;

    // Update positions from flag points
    const numRows = flagComponent.segmentsY + 1;
    const numCols = flagComponent.segmentsX + 1;

    for (let y = 0; y < numRows; y++) {
      for (let x = 0; x < numCols; x++) {
        const index = y * numCols + x;
        const point = flagComponent.points[index];

        positionAttribute.setXYZ(index, point.position.x, point.position.y, point.position.z);
      }
    }

    positionAttribute.needsUpdate = true;
    geometry.computeVertexNormals();
  }

  private renderPoleEntity(poleEntityId: EntityId, context: IRenderContext): void {
    if (!this.world) return;

    const poleMesh = this.poleMeshes.get(poleEntityId);
    if (!poleMesh) {
      const newMesh = this.createPoleMesh(poleEntityId);
      if (newMesh) {
        this.poleMeshes.set(poleEntityId, newMesh);
        context.scene.add(newMesh);
      }
    }
  }

  private createPoleMesh(poleEntityId: EntityId): THREE.Mesh | null {
    if (!this.world) return null;

    const poleEntity = this.world.entityManager.getEntityById(poleEntityId);
    if (!poleEntity) return null;

    const poleComponent = this.world.componentManager.getComponent(
      poleEntity,
      'PoleComponent'
    ) as any;

    if (!poleComponent) return null;

    const geometry = new THREE.CylinderGeometry(
      poleComponent.radius,
      poleComponent.radius,
      poleComponent.height,
      8
    );

    const material = new THREE.MeshLambertMaterial({
      color: this.visualParameters.poleColor,
      opacity: this.visualParameters.poleOpacity,
      transparent: this.visualParameters.poleOpacity < 1.0
    });

    const mesh = new THREE.Mesh(geometry, material);

    // Position pole at the base
    mesh.position.set(
      poleComponent.position.x,
      poleComponent.position.y + poleComponent.height / 2,
      poleComponent.position.z
    );

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
  }

  private updateExistingMeshes(): void {
    // Update flag meshes
    this.flagMeshes.forEach(mesh => {
      const material = mesh.material as THREE.MeshLambertMaterial;
      material.color.set(this.visualParameters.flagColor);
      material.opacity = this.visualParameters.flagOpacity;
      material.transparent = this.visualParameters.flagOpacity < 1.0;
      material.wireframe = this.visualParameters.showWireframe;
      material.side = this.visualParameters.doubleSided ? THREE.DoubleSide : THREE.FrontSide;
      material.needsUpdate = true;
    });

    // Update pole meshes
    this.poleMeshes.forEach(mesh => {
      const material = mesh.material as THREE.MeshLambertMaterial;
      material.color.set(this.visualParameters.poleColor);
      material.opacity = this.visualParameters.poleOpacity;
      material.transparent = this.visualParameters.poleOpacity < 1.0;
      material.needsUpdate = true;
    });
  }

  private disposeMesh(mesh: THREE.Mesh): void {
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(material => material.dispose());
      } else {
        mesh.material.dispose();
      }
    }
  }
}

// Legacy functions for backward compatibility
export function createFlagMesh(flag: FlagComponent): THREE.Mesh {
  // This is a simplified version for backward compatibility
  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const indices: number[] = [];
  const segX = flag.segmentsX;
  const segY = flag.segmentsY;

  // Vertices
  for (let y = 0; y <= segY; ++y) {
    for (let x = 0; x <= segX; ++x) {
      const idx = y * (segX + 1) + x;
      const p = flag.points[idx];
      vertices.push(p.position.x, p.position.y, p.position.z);
    }
  }

  // Indices (two triangles per quad)
  for (let y = 0; y < segY; ++y) {
    for (let x = 0; x < segX; ++x) {
      const i0 = y * (segX + 1) + x;
      const i1 = i0 + 1;
      const i2 = i0 + (segX + 1);
      const i3 = i2 + 1;
      indices.push(i0, i2, i1);
      indices.push(i1, i2, i3);
    }
  }

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide
  });

  return new THREE.Mesh(geometry, material);
}

export function createPoleMesh(pole: any): THREE.Mesh {
  const geometry = new THREE.CylinderGeometry(
    pole.radius,
    pole.radius,
    pole.height,
    32
  );
  const material = new THREE.MeshStandardMaterial({ color: 0x0000ff });
  const poleMesh = new THREE.Mesh(geometry, material);
  poleMesh.position.set(pole.position.x, pole.position.y + pole.height / 2, pole.position.z);
  poleMesh.castShadow = true;
    poleMesh.receiveShadow = true;
  return poleMesh;
}
