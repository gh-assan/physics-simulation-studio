import * as THREE from "three";
import { System } from "../../core/ecs/System";
import { World } from "../../core/ecs/World";
import { FlagComponent } from "../../plugins/flag-simulation/FlagComponent";
import { PositionComponent } from "../../core/components/PositionComponent";
import { RenderableComponent } from "../../core/ecs/RenderableComponent";
import { RotationComponent } from "../../core/ecs/RotationComponent";
import { ThreeGraphicsManager } from "../graphics/ThreeGraphicsManager";

export class FlagRenderer extends System {
  private graphicsManager: ThreeGraphicsManager;
  private flagMeshes: Map<number, THREE.Mesh> = new Map();

  constructor(graphicsManager: ThreeGraphicsManager) {
    super();
    this.graphicsManager = graphicsManager;
  }

  init(): void {
    // No specific initialization needed
  }

  unregister(): void {
    // Clean up all flag meshes
    this.flagMeshes.forEach((mesh) => {
      this.graphicsManager.getScene().remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose();
      } else if (Array.isArray(mesh.material)) {
        mesh.material.forEach((material) => material.dispose());
      }
    });
    this.flagMeshes.clear();
  }

  update(world: World, _deltaTime: number): void {
    console.log("[FlagRenderer] Update called");

    // Log the scene children before updating
    console.log(
      "[FlagRenderer] Scene children before update:",
      this.graphicsManager.getScene().children.map((child) => ({
        type: child.type,
        position: child.position,
        visible: child.visible,
        name: child.name
      }))
    );

    const flagEntities = world.componentManager.getEntitiesWithComponents([
      PositionComponent,
      RenderableComponent,
      FlagComponent
    ]);
    console.log("[FlagRenderer] Found flag entities:", flagEntities.length);

    // Remove meshes for entities that no longer exist
    const currentEntities = new Set(flagEntities);
    for (const [entityId, mesh] of this.flagMeshes.entries()) {
      if (!currentEntities.has(entityId)) {
        console.log(`[FlagRenderer] Removing mesh for entity ${entityId}`);
        this.graphicsManager.getScene().remove(mesh);
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material instanceof THREE.Material) {
          mesh.material.dispose();
        } else if (Array.isArray(mesh.material)) {
          mesh.material.forEach((material) => material.dispose());
        }
        this.flagMeshes.delete(entityId);
      }
    }

    // Update or create meshes for flag entities
    for (const entityId of flagEntities) {
      console.log(`[FlagRenderer] Processing flag entity ${entityId}`);
      const flag = world.componentManager.getComponent(
        entityId,
        FlagComponent.type
      ) as FlagComponent;
      const renderable = world.componentManager.getComponent(
        entityId,
        RenderableComponent.name
      ) as RenderableComponent;

      if (!flag || !renderable) {
        console.log(
          `[FlagRenderer] Missing components for entity ${entityId}:`,
          { flag: !!flag, renderable: !!renderable }
        );
        continue;
      }

      if (flag.points.length === 0) {
        console.log(`[FlagRenderer] No points for flag entity ${entityId}`);
        continue;
      }

      console.log(
        `[FlagRenderer] Flag entity ${entityId} has ${flag.points.length} points`
      );
      if (flag.points.length > 0) {
        console.log(
          `[FlagRenderer] First point position:`,
          flag.points[0].position
        );
      }

      let flagMesh = this.flagMeshes.get(entityId);

      if (!flagMesh) {
        // Create a new mesh for this flag entity
        console.log(
          `[FlagRenderer] Creating new mesh for flag entity ${entityId}`
        );
        const geometry = new THREE.BufferGeometry();
        // Use a brighter material with emissive properties to make the flag more visible
        const material = new THREE.MeshStandardMaterial({
          color: renderable.color,
          side: THREE.DoubleSide,
          emissive: new THREE.Color(renderable.color).multiplyScalar(0.3),
          emissiveIntensity: 0.5,
          metalness: 0.1,
          roughness: 0.5
        });
        flagMesh = new THREE.Mesh(geometry, material);
        console.log(
          `[FlagRenderer] Adding flag mesh to scene for entity ${entityId}`
        );
        this.graphicsManager.getScene().add(flagMesh);
        this.flagMeshes.set(entityId, flagMesh);
        console.log(
          `[FlagRenderer] Created flag mesh for entity ${entityId}. Scene children:`,
          this.graphicsManager.getScene().children.length
        );

        // Log detailed information about the flag mesh
        console.log(`[FlagRenderer] Flag mesh details:`, {
          uuid: flagMesh.uuid,
          visible: flagMesh.visible,
          position: flagMesh.position,
          rotation: flagMesh.rotation,
          scale: flagMesh.scale,
          material: {
            type: (flagMesh.material as THREE.MeshStandardMaterial).type,
            color: (flagMesh.material as THREE.MeshStandardMaterial).color,
            side: (flagMesh.material as THREE.MeshStandardMaterial).side,
            transparent: (flagMesh.material as THREE.MeshStandardMaterial)
              .transparent,
            opacity: (flagMesh.material as THREE.MeshStandardMaterial).opacity
          }
        });
        return;
      }

      console.log(
        `[FlagRenderer] Using existing mesh for flag entity ${entityId}`
      );

      // Update flag geometry
      this.updateFlagGeometry(flag, flagMesh);

      // Set position and rotation from components
      const position = world.componentManager.getComponent(
        entityId,
        PositionComponent.name
      ) as PositionComponent;

      const rotation = world.componentManager.getComponent(
        entityId,
        RotationComponent.name
      ) as RotationComponent;

      if (position) {
        flagMesh.position.set(position.x, position.y, position.z);
      }

      if (rotation) {
        flagMesh.rotation.setFromQuaternion(
          new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w)
        );
      }
    }

    // Log the scene children after updating
    console.log(
      "[FlagRenderer] Scene children after update:",
      this.graphicsManager.getScene().children.map((child) => ({
        type: child.type,
        position: child.position,
        visible: child.visible,
        name: child.name,
        uuid: child.uuid
      }))
    );

    // Force a render to ensure changes are displayed
    this.graphicsManager.render();
  }

  private updateFlagGeometry(flag: FlagComponent, mesh: THREE.Mesh): void {
    console.log(
      `[FlagRenderer] Updating flag geometry with ${flag.points.length} points`
    );
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const numRows = flag.segmentsY + 1;
    const numCols = flag.segmentsX + 1;

    // Add vertices and UVs
    for (let i = 0; i < flag.points.length; i++) {
      const point = flag.points[i];
      positions.push(point.position.x, point.position.y, point.position.z);

      const x = i % numCols;
      const y = Math.floor(i / numCols);
      uvs.push(x / (numCols - 1), 1 - y / (numRows - 1)); // Flip Y for UVs
    }

    // Add triangles
    for (let y = 0; y < numRows - 1; y++) {
      for (let x = 0; x < numCols - 1; x++) {
        const i0 = y * numCols + x;
        const i1 = y * numCols + x + 1;
        const i2 = (y + 1) * numCols + x;
        const i3 = (y + 1) * numCols + x + 1;

        // Triangle 1
        indices.push(i0, i2, i1);
        // Triangle 2
        indices.push(i1, i2, i3);
      }
    }

    const geometry = mesh.geometry as THREE.BufferGeometry;
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals(); // Recalculate normals for lighting
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.uv.needsUpdate = true;
    if (geometry.index) {
      geometry.index.needsUpdate = true;
    }
    console.log(
      `[FlagRenderer] Flag geometry updated with ${positions.length / 3} vertices and ${indices.length / 3} triangles`
    );
  }

  // Method to get a flag mesh for a specific entity
  public getFlagMesh(entityId: number): THREE.Mesh | undefined {
    return this.flagMeshes.get(entityId);
  }
}
