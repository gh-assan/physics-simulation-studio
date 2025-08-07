import * as THREE from "three";
import { IRenderer } from "./RenderOrchestrator";
import { IWorld } from "../../core/ecs/IWorld";
import { PositionComponent } from "../../core/components/PositionComponent";
import { RotationComponent } from "../../core/ecs/RotationComponent";
import { RenderableComponent } from "../../core/ecs/RenderableComponent";
import { SelectableComponent } from "../../core/components/SelectableComponent";
import { createGeometry } from "../utils/ThreeJsUtils";
import { MaterialDisposer } from "../utils/MaterialDisposer";
import { ThreeGraphicsManager } from "../graphics/ThreeGraphicsManager";

/**
 * Fallback renderer for entities with basic RenderableComponent that don't have specialized renderers
 * This provides a clean separation between specialized plugin renderers and basic entity rendering
 */
export class FallbackRenderer implements IRenderer {
  private graphicsManager: ThreeGraphicsManager;
  private meshes: Map<number, THREE.Mesh> = new Map();
  private handledEntityTypes: Set<string> = new Set();

  constructor(graphicsManager: ThreeGraphicsManager) {
    this.graphicsManager = graphicsManager;
  }

  /**
   * Register component types that are handled by specialized renderers
   * Entities with these components will be skipped by the fallback renderer
   */
  public registerHandledComponentType(componentType: string): void {
    this.handledEntityTypes.add(componentType);
  }

  /**
   * Unregister a component type from being handled by specialized renderers
   */
  public unregisterHandledComponentType(componentType: string): void {
    this.handledEntityTypes.delete(componentType);
  }

  public update(world: IWorld, _deltaTime: number): void {
    this.clear();

    // Get all entities with basic rendering components
    const entities = world.componentManager.getEntitiesWithComponents([
      PositionComponent,
      RotationComponent,
      RenderableComponent
    ]);

    for (const entityId of entities) {
      // Skip entities that have specialized renderers
      if (this.isEntityHandledBySpecializedRenderer(world, entityId)) {
        continue;
      }

      const components = this.getEntityComponents(world, entityId);
      if (!components) continue;

      const mesh = this.getOrCreateMesh(entityId, components.renderable);
      this.updateMeshTransform(mesh, components.position, components.rotation);
      this.updateMeshSelection(world, entityId, mesh);
    }
  }

  private isEntityHandledBySpecializedRenderer(world: IWorld, entityId: number): boolean {
    // Check if entity has any components that are handled by specialized renderers
    for (const componentType of this.handledEntityTypes) {
      if (world.componentManager.hasComponent(entityId, componentType)) {
        return true;
      }
    }
    return false;
  }

  private getEntityComponents(world: IWorld, entityId: number) {
    const position = world.componentManager.getComponent(entityId, PositionComponent.type) as PositionComponent;
    const rotation = world.componentManager.getComponent(entityId, RotationComponent.name) as RotationComponent;
    const renderable = world.componentManager.getComponent(entityId, RenderableComponent.name) as RenderableComponent;

    if (!position || !rotation || !renderable) return null;

    return { position, rotation, renderable };
  }

  private getOrCreateMesh(entityId: number, renderable: RenderableComponent): THREE.Mesh {
    const existingMesh = this.meshes.get(entityId);
    if (existingMesh) return existingMesh;

    const geometryType = renderable.geometry as "box" | "sphere" | "cylinder" | "cone" | "plane";
    const geometry = createGeometry(geometryType);
    const material = new THREE.MeshBasicMaterial({ color: renderable.color });
    const mesh = new THREE.Mesh(geometry, material);

    this.graphicsManager.getScene().add(mesh);
    this.meshes.set(entityId, mesh);
    return mesh;
  }

  private updateMeshTransform(mesh: THREE.Mesh, position: PositionComponent, rotation: RotationComponent): void {
    mesh.position.set(position.x, position.y, position.z);
    mesh.rotation.setFromQuaternion(new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w));
  }

  private updateMeshSelection(world: IWorld, entityId: number, mesh: THREE.Mesh): void {
    const selectable = world.componentManager.getComponent(entityId, SelectableComponent.name) as SelectableComponent;
    if (!selectable) return;

    const material = mesh.material as THREE.MeshBasicMaterial;
    material.color.setHex(selectable.isSelected ? 0xff0000 : 0x00ff00);
  }

  public clear(): void {
    // Clean up managed meshes
    this.meshes.forEach((mesh) => {
      this.graphicsManager.getScene().remove(mesh);
      mesh.geometry.dispose();
      MaterialDisposer.dispose(mesh.material);
    });
    this.meshes.clear();
  }

  public dispose(): void {
    this.clear();
    this.handledEntityTypes.clear();
  }
}
