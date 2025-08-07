import * as THREE from "three";
import { System } from "../../core/ecs/System";
import { World } from "../../core/ecs/World";
import { PositionComponent } from "../../core/components/PositionComponent";
import { RotationComponent } from "../../core/ecs/RotationComponent";
import { RenderableComponent } from "../../core/ecs/RenderableComponent";
import { IGraphicsManager } from "../IGraphicsManager";
import { SelectableComponent } from "../../core/components/SelectableComponent";
import { createGeometry, disposeThreeJsObject } from "../utils/ThreeJsUtils";
import { ThreeGraphicsManager } from "../graphics/ThreeGraphicsManager";
import { MaterialDisposer } from "../utils/MaterialDisposer";

export class RenderSystem extends System {
  private graphicsManager: ThreeGraphicsManager;
  private meshes: Map<number, THREE.Mesh> = new Map();
  private raycaster!: THREE.Raycaster;
  private mouse!: THREE.Vector2;
  private world: World;
  private renderOrchestrator: any; // The single source of rendering truth

  constructor(graphicsManager: ThreeGraphicsManager, world: World) {
    super(); // Use default priority - timing doesn't matter anymore
    this.graphicsManager = graphicsManager;
    this.world = world;

    // Setup raycaster for object selection
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    window.addEventListener("mousedown", this.onMouseDown, false);

    // Listen for parameter changes to update rendering without starting simulation
    window.addEventListener(
      "parameter-changed",
      this.onParameterChanged,
      false
    );
  }

  /**
   * Set the RenderOrchestrator as the single source of rendering truth
   */
  public setRenderOrchestrator(orchestrator: any): void {
    this.renderOrchestrator = orchestrator;
  }

  // Automatically clean up meshes/materials when an entity is removed
  public onEntityRemoved(entityId: number, world: any): void {
    const mesh = this.meshes.get(entityId);
    if (mesh) {
      this.graphicsManager.getScene().remove(mesh);
      mesh.geometry.dispose();
      MaterialDisposer.dispose(mesh.material);
      this.meshes.delete(entityId);
    }
  }

  private onMouseDown = (event: MouseEvent): void => {
    // Calculate mouse position in normalized device coordinates (-1 to +1) for both components
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the raycaster with the camera and mouse position
    this.raycaster.setFromCamera(this.mouse, this.graphicsManager.getCamera());

    // Calculate objects intersecting the ray
    const intersects = this.raycaster.intersectObjects(
      this.graphicsManager.getScene().children
    );

    // Get the current world from the studio
    const world = this.world;

    // Deselect all currently selected entities
    const currentlySelected = world.componentManager
      .getEntitiesWithComponents([SelectableComponent])
      .filter((entityId: number) => {
        const selectable = world.componentManager.getComponent(
          entityId,
          SelectableComponent.name
        ) as SelectableComponent;
        return selectable.isSelected;
      });

    currentlySelected.forEach((entityId: number) => {
      const selectable = world.componentManager.getComponent(
        entityId,
        SelectableComponent.name
      ) as SelectableComponent;
      selectable.isSelected = false;
    });

    if (intersects.length > 0) {
      // Find the first intersected object that corresponds to an entity
      const intersectedMesh = intersects[0].object as THREE.Mesh;
      let selectedEntityId: number | null = null;

      // Find the entity ID associated with the intersected mesh
      for (const [entityId, mesh] of this.meshes.entries()) {
        if (mesh === intersectedMesh) {
          selectedEntityId = entityId;
          break;
        }
      }

      if (selectedEntityId) {
        const selectable = world.componentManager.getComponent(
          selectedEntityId,
          SelectableComponent.name
        ) as SelectableComponent;
        if (selectable) {
          selectable.isSelected = true;
        }
      }
    }
  }

  private onParameterChanged = (event: Event): void => {
    // Trigger a re-render when parameters change
    this.graphicsManager.render();
  }

  public update(world: World, deltaTime: number): void {
    // STREAMLINED DESIGN: Single delegation point
    if (this.renderOrchestrator) {
      // Delegate ALL rendering to the orchestrator - it knows best
      this.renderOrchestrator.update(world, deltaTime);
    } else {
      // Fallback only if no orchestrator exists (for backward compatibility)
      this.renderAllEntities(world);
    }

    // Final render call
    this.graphicsManager.render();
  }

  /**
   * Simple fallback: render all entities (used when no RenderOrchestrator)
   */
  private renderAllEntities(world: World): void {
    this.clear();

    const entities = world.componentManager.getEntitiesWithComponents([
      PositionComponent,
      RotationComponent,
      RenderableComponent
    ]);

    for (const entityId of entities) {
      const components = this.getEntityComponents(world, entityId);
      if (!components) continue;

      const mesh = this.getOrCreateMesh(world, entityId, components.renderable);
      this.updateMeshTransform(mesh, components.position, components.rotation);
      this.updateMeshSelection(world, entityId, mesh);
    }
  }

  /**
   * Gets the graphics manager used by this render system
   * @returns The ThreeGraphicsManager instance
   */
  public getGraphicsManager(): IGraphicsManager {
    if (!this.graphicsManager) {
      throw new Error("RenderSystem: graphicsManager is not initialized!");
    }
    return this.graphicsManager;
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

  private getEntityComponents(world: World, entityId: number) {
    const position = world.componentManager.getComponent(entityId, PositionComponent.type) as PositionComponent;
    const rotation = world.componentManager.getComponent(entityId, RotationComponent.name) as RotationComponent;
    const renderable = world.componentManager.getComponent(entityId, RenderableComponent.name) as RenderableComponent;

    if (!position || !rotation || !renderable) return null;

    return { position, rotation, renderable };
  }

  private getOrCreateMesh(world: World, entityId: number, renderable: RenderableComponent): THREE.Mesh {
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

  private updateMeshSelection(world: World, entityId: number, mesh: THREE.Mesh): void {
    const selectable = world.componentManager.getComponent(entityId, SelectableComponent.name) as SelectableComponent;
    if (!selectable) return;

    const material = mesh.material as THREE.MeshBasicMaterial;
    material.color.setHex(selectable.isSelected ? 0xff0000 : 0x00ff00);
  }
}
