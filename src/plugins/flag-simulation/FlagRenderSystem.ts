import * as THREE from "three";
import { System } from "../../core/ecs/System";
import { IWorld } from "../../core/ecs/IWorld";
import { PositionComponent } from "../../core/components/PositionComponent";
import { RotationComponent } from "../../core/components/RotationComponent";
import { RenderableComponent } from "../../core/ecs/RenderableComponent";
import { IRenderable } from "../../core/components/IRenderable";
import { ThreeGraphicsManager } from "../../studio/graphics/ThreeGraphicsManager";
import { FlagComponent } from "./FlagComponent";
import { PoleComponent } from "./PoleComponent";
import { createFlagMesh, createPoleMesh } from "./FlagRenderer";

export class FlagRenderSystem extends System implements IRenderable {
  private graphicsManager: ThreeGraphicsManager;
  private meshes: Map<number, THREE.Mesh> = new Map();
  private poleMeshes: Map<number, THREE.Mesh> = new Map();

  constructor(graphicsManager: ThreeGraphicsManager) {
    super();
    this.graphicsManager = graphicsManager;
  }

  public update(world: World, _deltaTime: number): void {
    // Render FlagComponents
    const flagEntities = world.componentManager.getEntitiesWithComponents([
      FlagComponent,
      PositionComponent,
      RotationComponent,
      RenderableComponent,
    ]);

    for (const entityId of flagEntities) {
      const flagComponent = world.componentManager.getComponent(
        entityId,
        FlagComponent.type
      ) as FlagComponent;
      const position = world.componentManager.getComponent(
        entityId,
        PositionComponent.type
      ) as PositionComponent;
      const rotation = world.componentManager.getComponent(
        entityId,
        RotationComponent.type
      ) as RotationComponent;
      const renderable = world.componentManager.getComponent(
        entityId,
        RenderableComponent.name
      ) as RenderableComponent;

      if (!flagComponent || !position || !rotation || !renderable) {
        continue; // Skip if any component is missing
      }

      let flagMesh = this.meshes.get(entityId);

      if (!flagMesh) {
        flagMesh = createFlagMesh(flagComponent);
        this.graphicsManager.getScene().add(flagMesh);
        this.meshes.set(entityId, flagMesh);
      } else {
        // Update existing flag mesh positions
        const positions = flagMesh.geometry.attributes.position
          .array as Float32Array;
        flagComponent.points.forEach((p: any, i: number) => {
          positions[i * 3] = p.position.x;
          positions[i * 3 + 1] = p.position.y;
          positions[i * 3 + 2] = p.position.z;
        });
        flagMesh.geometry.attributes.position.needsUpdate = true;
        flagMesh.geometry.computeVertexNormals();
      }

      // Update mesh position and rotation
      flagMesh.position.set(position.x, position.y, position.z);
      flagMesh.rotation.setFromQuaternion(
        new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w)
      );
    }

    // Render PoleComponents
    const poleEntities = world.componentManager.getEntitiesWithComponents([
      PoleComponent,
      PositionComponent,
    ]);

    for (const entityId of poleEntities) {
      const poleComponent = world.componentManager.getComponent(
        entityId,
        PoleComponent.type
      ) as PoleComponent;
      const position = world.componentManager.getComponent(
        entityId,
        PositionComponent.type
      ) as PositionComponent;

      if (!poleComponent || !position) {
        continue;
      }

      let poleMesh = this.poleMeshes.get(entityId);

      if (!poleMesh) {
        poleMesh = createPoleMesh(poleComponent);
        this.graphicsManager.getScene().add(poleMesh);
        this.poleMeshes.set(entityId, poleMesh);
      }

      // Update pole mesh position (only if it changes, or if it's dynamic)
      poleMesh.position.set(
        position.x,
        position.y + poleComponent.height / 2,
        position.z
      );
    }
  }

  public render(world: World, scene: THREE.Scene, camera: THREE.Camera): void {
    // Call update to perform rendering logic
    this.update(world, 0);
  }

  public onEntityRemoved(entityId: number, world: IWorld): void {
    const mesh = this.meshes.get(entityId);
    if (mesh) {
      this.graphicsManager.getScene().remove(mesh);
      mesh.geometry.dispose();
      if (mesh.material instanceof THREE.Material) mesh.material.dispose();
      else if (Array.isArray(mesh.material)) mesh.material.forEach((m: any) => m.dispose());
      this.meshes.delete(entityId);
    }
    const poleMesh = this.poleMeshes.get(entityId);
    if (poleMesh) {
      this.graphicsManager.getScene().remove(poleMesh);
      poleMesh.geometry.dispose();
      if (poleMesh.material instanceof THREE.Material) poleMesh.material.dispose();
      else if (Array.isArray(poleMesh.material)) poleMesh.material.forEach((m: any) => m.dispose());
      this.poleMeshes.delete(entityId);
    }
  }

  public clear(): void {
    this.meshes.forEach((mesh) => {
      this.graphicsManager.getScene().remove(mesh);
      mesh.geometry.dispose();
      if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose();
      } else if (Array.isArray(mesh.material)) {
        mesh.material.forEach((material) => material.dispose());
      }
    });
    this.meshes.clear();

    this.poleMeshes.forEach((mesh) => {
      this.graphicsManager.getScene().remove(mesh);
      mesh.geometry.dispose();
      if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose();
      } else if (Array.isArray(mesh.material)) {
        mesh.material.forEach((material) => material.dispose());
      }
    });
    this.poleMeshes.clear();
  }
}
