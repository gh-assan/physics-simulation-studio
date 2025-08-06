import { IRenderer } from "./RenderOrchestrator";
import { IWorld } from "../../core/ecs/IWorld";
import { ThreeGraphicsManager } from "../graphics/ThreeGraphicsManager";
import { FlagComponent } from "../../plugins/flag-simulation/FlagComponent";
import { PoleComponent } from "../../plugins/flag-simulation/PoleComponent";
import { PositionComponent } from "../../core/components/PositionComponent";
import { RotationComponent } from "../../core/components/RotationComponent";
import { RenderableComponent } from "../../core/components/RenderableComponent";
import { Logger } from "../../core/utils/Logger";
import * as THREE from "three";

/**
 * Centralized flag renderer that handles all flag and pole rendering
 * Replaces the scattered FlagRenderSystem and FlagRenderer classes
 */
export class FlagRenderer implements IRenderer {
  private graphicsManager: ThreeGraphicsManager;
  private flagMeshes: Map<number, THREE.Mesh> = new Map();
  private poleMeshes: Map<number, THREE.Mesh> = new Map();

  constructor(graphicsManager: ThreeGraphicsManager) {
    this.graphicsManager = graphicsManager;
  }

  /**
   * Update flag and pole rendering
   */
  public update(world: IWorld, deltaTime: number): void {
    this.updateFlags(world);
    this.updatePoles(world);
  }

  /**
   * Update flag rendering
   */
  private updateFlags(world: IWorld): void {
    const flagEntities = world.componentManager.getEntitiesWithComponents([
      FlagComponent,
      PositionComponent,
      RotationComponent,
      RenderableComponent,
    ]);

    // Remove meshes for entities that no longer exist
    const currentEntities = new Set(flagEntities);
    for (const [entityId, mesh] of this.flagMeshes.entries()) {
      if (!currentEntities.has(entityId)) {
        this.removeFlagMesh(entityId);
      }
    }

    // Update or create meshes for flag entities
    for (const entityId of flagEntities) {
      const flag = world.componentManager.getComponent(entityId, FlagComponent.type) as FlagComponent;
      const position = world.componentManager.getComponent(entityId, PositionComponent.type) as PositionComponent;
      const rotation = world.componentManager.getComponent(entityId, RotationComponent.type) as RotationComponent;
      const renderable = world.componentManager.getComponent(entityId, RenderableComponent.name) as RenderableComponent;

      if (!flag || !position || !rotation || !renderable) {
        continue;
      }

      let flagMesh = this.flagMeshes.get(entityId);

      if (!flagMesh) {
        // Create new flag mesh
        flagMesh = this.createFlagMesh(flag, renderable);
        this.graphicsManager.getScene().add(flagMesh);
        this.flagMeshes.set(entityId, flagMesh);
      }

      // Update flag geometry
      this.updateFlagGeometry(flag, flagMesh);

      // Update position and rotation
      flagMesh.position.set(position.x, position.y, position.z);
      flagMesh.rotation.setFromQuaternion(
        new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w)
      );
    }
  }

  /**
   * Update pole rendering
   */
  private updatePoles(world: IWorld): void {
    const poleEntities = world.componentManager.getEntitiesWithComponents([
      PoleComponent,
      PositionComponent,
    ]);

    // Remove meshes for entities that no longer exist
    const currentEntities = new Set(poleEntities);
    for (const [entityId, mesh] of this.poleMeshes.entries()) {
      if (!currentEntities.has(entityId)) {
        this.removePoleMesh(entityId);
      }
    }

    // Update or create meshes for pole entities
    for (const entityId of poleEntities) {
      const pole = world.componentManager.getComponent(entityId, PoleComponent.type) as PoleComponent;
      const position = world.componentManager.getComponent(entityId, PositionComponent.type) as PositionComponent;

      if (!pole || !position) {
        continue;
      }

      let poleMesh = this.poleMeshes.get(entityId);

      if (!poleMesh) {
        // Create new pole mesh
        poleMesh = this.createPoleMesh(pole);
        this.graphicsManager.getScene().add(poleMesh);
        this.poleMeshes.set(entityId, poleMesh);
      }

      // Update position
      poleMesh.position.set(position.x, position.y, position.z);
    }
  }

  /**
   * Create a flag mesh
   */
  private createFlagMesh(flag: FlagComponent, renderable: RenderableComponent): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(flag.width, flag.height, flag.segmentsX, flag.segmentsY);
    const material = new THREE.MeshStandardMaterial({
      color: renderable.color,
      side: THREE.DoubleSide,
      emissive: new THREE.Color(renderable.color).multiplyScalar(0.3),
      emissiveIntensity: 0.5,
      metalness: 0.1,
      roughness: 0.5
    });

    return new THREE.Mesh(geometry, material);
  }

  /**
   * Create a pole mesh
   */
  private createPoleMesh(pole: PoleComponent): THREE.Mesh {
    const geometry = new THREE.CylinderGeometry(
      pole.radius,
      pole.radius,
      pole.height,
      8
    );
    const material = new THREE.MeshStandardMaterial({
      color: 0x8b4513, // Brown color for pole
      metalness: 0.2,
      roughness: 0.8
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = pole.height / 2; // Center the pole vertically
    return mesh;
  }

  /**
   * Update flag geometry based on component properties
   */
  private updateFlagGeometry(flag: FlagComponent, mesh: THREE.Mesh): void {
    const geometry = mesh.geometry as THREE.PlaneGeometry;

    // Check if geometry needs to be updated
    const currentWidth = geometry.parameters.width;
    const currentHeight = geometry.parameters.height;
    const currentSegments = geometry.parameters.widthSegments;

    if (currentWidth !== flag.width ||
        currentHeight !== flag.height ||
        currentSegments !== flag.segmentsX) {

      // Dispose old geometry
      geometry.dispose();

      // Create new geometry
      const newGeometry = new THREE.PlaneGeometry(
        flag.width,
        flag.height,
        flag.segmentsX,
        flag.segmentsY
      );

      mesh.geometry = newGeometry;
    }

    // Apply wind effect if present
    if (flag.windStrength && flag.windDirection) {
      this.applyWindEffect(flag, mesh);
    }
  }

  /**
   * Apply wind effect to flag geometry
   */
  private applyWindEffect(flag: FlagComponent, mesh: THREE.Mesh): void {
    const geometry = mesh.geometry as THREE.PlaneGeometry;
    const positions = geometry.attributes.position;
    const time = Date.now() * 0.001;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);

      // Create wave effect based on wind
      const wave = Math.sin(x * 2 + time * flag.windStrength) * 0.1 * flag.windStrength;
      positions.setZ(i, wave);
    }

    positions.needsUpdate = true;
  }

  /**
   * Remove a flag mesh
   */
  private removeFlagMesh(entityId: number): void {
    const mesh = this.flagMeshes.get(entityId);
    if (mesh) {
      this.graphicsManager.getScene().remove(mesh);
      this.disposeMesh(mesh);
      this.flagMeshes.delete(entityId);
    }
  }

  /**
   * Remove a pole mesh
   */
  private removePoleMesh(entityId: number): void {
    const mesh = this.poleMeshes.get(entityId);
    if (mesh) {
      this.graphicsManager.getScene().remove(mesh);
      this.disposeMesh(mesh);
      this.poleMeshes.delete(entityId);
    }
  }

  /**
   * Safely dispose a mesh
   */
  private disposeMesh(mesh: THREE.Mesh): void {
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    if (mesh.material instanceof THREE.Material) {
      mesh.material.dispose();
    } else if (Array.isArray(mesh.material)) {
      mesh.material.forEach((material) => material.dispose());
    }
  }

  /**
   * Clear all flag and pole meshes
   */
  public clear(): void {
    // Clear flag meshes
    for (const [entityId] of this.flagMeshes) {
      this.removeFlagMesh(entityId);
    }

    // Clear pole meshes
    for (const [entityId] of this.poleMeshes) {
      this.removePoleMesh(entityId);
    }
  }

  /**
   * Dispose the renderer
   */
  public dispose(): void {
    this.clear();
  }

  /**
   * Get debug information
   */
  public getDebugInfo(): { flagCount: number; poleCount: number } {
    return {
      flagCount: this.flagMeshes.size,
      poleCount: this.poleMeshes.size
    };
  }
}
