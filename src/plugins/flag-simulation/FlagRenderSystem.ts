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
import { MaterialDisposer } from "../../studio/utils/MaterialDisposer";

export class FlagRenderSystem extends System implements IRenderable {
  private graphicsManager: ThreeGraphicsManager;
  private meshes: Map<number, THREE.Mesh> = new Map();
  private poleMeshes: Map<number, THREE.Mesh> = new Map();
  private renderOrchestrator: any; // Will be set when system is initialized

  constructor(graphicsManager: ThreeGraphicsManager) {
    super();
    this.graphicsManager = graphicsManager;
  }

  /**
   * Called when the system is registered with the world
   */
  public onRegister(world: IWorld): void {
    // Find the render orchestrator in the world's systems
    const systems = (world as any).systemManager.systems;
    for (const system of systems) {
      if (system.constructor.name === 'RenderOrchestrator') {
        this.renderOrchestrator = system;
        // Register this system as a renderer
        this.renderOrchestrator.registerRenderer('flag-renderer', {
          update: this.renderEntities.bind(this),
          clear: this.clear.bind(this)
        });
        
        // Tell fallback renderer to skip flag entities
        const fallbackRenderer = this.renderOrchestrator.renderers?.get('fallback');
        if (fallbackRenderer && typeof fallbackRenderer.registerHandledComponentType === 'function') {
          fallbackRenderer.registerHandledComponentType('FlagComponent');
          fallbackRenderer.registerHandledComponentType('PoleComponent');
        }
        
        break;
      }
    }
  }

  /**
   * Called when the system is removed from the world
   */
  public onRemove(world: IWorld): void {
    if (this.renderOrchestrator) {
      this.renderOrchestrator.unregisterRenderer('flag-renderer');
    }
    this.clear();
  }

  public update(world: IWorld, deltaTime: number): void {
    // This method is called by the ECS system manager
    // The actual rendering is handled by renderEntities which is called by RenderOrchestrator
  }

  /**
   * Render flag and pole entities - called by RenderOrchestrator
   */
  public renderEntities(world: IWorld, _deltaTime: number): void {
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
        return;
      }

      this.updateFlagMeshPositions(flagMesh, flagComponent);

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

  public render(world: IWorld, scene: THREE.Scene, camera: THREE.Camera): void {
    // Call renderEntities to perform rendering logic
    this.renderEntities(world, 0);
  }

  public onEntityRemoved(entityId: number, world: IWorld): void {
    const mesh = this.meshes.get(entityId);
    if (mesh) {
      this.graphicsManager.getScene().remove(mesh);
      mesh.geometry.dispose();
      MaterialDisposer.dispose(mesh.material);
      this.meshes.delete(entityId);
    }
    const poleMesh = this.poleMeshes.get(entityId);
    if (poleMesh) {
      this.graphicsManager.getScene().remove(poleMesh);
      poleMesh.geometry.dispose();
      MaterialDisposer.dispose(poleMesh.material);
      this.poleMeshes.delete(entityId);
    }
  }

  /**
   * Updates existing flag mesh positions from flag component points
   * @param flagMesh The flag mesh to update
   * @param flagComponent The flag component containing point data
   */
  private updateFlagMeshPositions(flagMesh: THREE.Mesh, flagComponent: FlagComponent): void {
    const positions = flagMesh.geometry.attributes.position.array as Float32Array;
    flagComponent.points.forEach((p: any, i: number) => {
      positions[i * 3] = p.position.x;
      positions[i * 3 + 1] = p.position.y;
      positions[i * 3 + 2] = p.position.z;
    });
    flagMesh.geometry.attributes.position.needsUpdate = true;
    flagMesh.geometry.computeVertexNormals();
  }

  public clear(): void {
    this.meshes.forEach((mesh) => {
      this.graphicsManager.getScene().remove(mesh);
      mesh.geometry.dispose();
      MaterialDisposer.dispose(mesh.material);
    });
    this.meshes.clear();

    this.poleMeshes.forEach((mesh) => {
      this.graphicsManager.getScene().remove(mesh);
      mesh.geometry.dispose();
      MaterialDisposer.dispose(mesh.material);
    });
    this.poleMeshes.clear();
  }
}
