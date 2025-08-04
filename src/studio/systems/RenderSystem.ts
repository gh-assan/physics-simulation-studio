import * as THREE from "three";
import { System } from "../../core/ecs/System";
import { World } from "../../core/ecs/World";
import { PositionComponent } from "../../core/ecs/PositionComponent";
import { RotationComponent } from "../../core/ecs/RotationComponent";
import { RenderableComponent } from "../../core/ecs/RenderableComponent";

import { WaterRenderer } from "../../plugins/water-simulation/WaterRenderer"; // Import WaterRenderer
import { SelectableComponent } from "../../core/components/SelectableComponent"; // Import SelectableComponent
import { createGeometry, disposeThreeJsObject } from "../utils/ThreeJsUtils";
import { ThreeGraphicsManager } from "../graphics/ThreeGraphicsManager";

import { WaterDropletComponent } from "../../plugins/water-simulation/WaterComponents"; // Import WaterDropletComponent

export class RenderSystem extends System {
  private graphicsManager: ThreeGraphicsManager;
  private meshes: Map<number, THREE.Mesh> = new Map();
  private raycaster!: THREE.Raycaster;
  private mouse!: THREE.Vector2;
  private world: World;
  // ...existing code...

  constructor(graphicsManager: ThreeGraphicsManager, world: World) {
    super(1000);
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

  // Automatically clean up meshes/materials when an entity is removed
  public onEntityRemoved(entityId: number, world: any): void {
    const mesh = this.meshes.get(entityId);
    if (mesh) {
      this.graphicsManager.getScene().remove(mesh);
      mesh.geometry.dispose();
      if (mesh.material instanceof THREE.Material) mesh.material.dispose();
      else if (Array.isArray(mesh.material)) mesh.material.forEach((m: any) => m.dispose());
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

      if (selectedEntityId !== null) {
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
    // This method will be called when a 'parameter-changed' event is dispatched.
    // It can be used to trigger a re-render or update specific parts of the scene
    // based on the changed parameter, without necessarily restarting the simulation.
    console.log('Parameter changed, re-rendering scene:', event);
    // Example: if a parameter affects a mesh's color, update it here.
    // For now, just trigger a render cycle.
    this.graphicsManager.render();
  }

  public update(world: World, _deltaTime: number): void {
    // Always use the current world from the studio
    this.clear();

    // --- Water droplet debug rendering (unchanged) ---
    const dropletEntities = world.componentManager.getEntitiesWithComponents([
      WaterDropletComponent
    ]);
    for (const entityId of dropletEntities) {
      const position = world.componentManager.getComponent(
        entityId,
        PositionComponent.type
      ) as PositionComponent;
      if (!position) continue;
      let debugBox = this.graphicsManager.getScene().getObjectByName(`debugBox_${entityId}`);
      if (!debugBox) {
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
        debugBox = new THREE.Mesh(geometry, material);
        debugBox.name = `debugBox_${entityId}`;
        this.graphicsManager.getScene().add(debugBox);
      }
      debugBox.position.set(position.x, position.y, position.z);
    }

    // --- Generic mesh rendering for other entities ---
    const entities = world.componentManager.getEntitiesWithComponents([
      PositionComponent,
      RotationComponent,
      RenderableComponent
    ]);
    for (const entityId of entities) {
      // Skip if already handled as water droplet
      if (world.componentManager.hasComponent(entityId, WaterDropletComponent.type)) continue;

      const position = world.componentManager.getComponent(
        entityId,
        PositionComponent.name
      ) as PositionComponent;
      const rotation = world.componentManager.getComponent(
        entityId,
        RotationComponent.name
      ) as RotationComponent;
      const renderable = world.componentManager.getComponent(
        entityId,
        RenderableComponent.name
      ) as RenderableComponent;
      if (!position || !rotation || !renderable) continue;

      let mesh = this.meshes.get(entityId);
      if (!mesh) {
        const geometry = createGeometry(renderable.geometry);
        const material = new THREE.MeshBasicMaterial({ color: renderable.color });
        mesh = new THREE.Mesh(geometry, material);
        // Scale mesh by radius if CelestialBodyComponent is present
        const celestialBody = world.componentManager.getComponent(
          entityId,
          'CelestialBodyComponent'
        ) as any;
        if (celestialBody && typeof celestialBody.radius === 'number') {
          const VISUALIZATION_RADIUS_SCALE = 0.01;
          const scaledRadius = Math.max(0.1, celestialBody.radius * VISUALIZATION_RADIUS_SCALE);
          mesh.scale.set(scaledRadius, scaledRadius, scaledRadius);
        }
        this.graphicsManager.getScene().add(mesh);
        this.meshes.set(entityId, mesh);
      }
      mesh.position.set(position.x, position.y, position.z);
      mesh.rotation.setFromQuaternion(
        new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w)
      );
      const selectable = world.componentManager.getComponent(
        entityId,
        SelectableComponent.name
      ) as SelectableComponent;
      if (selectable) {
        const material = mesh.material as THREE.MeshBasicMaterial;
        if (selectable.isSelected) {
          material.color.set(0xffff00);
        } else {
          material.color.set(renderable.color);
        }
      }
    }

    this.graphicsManager.render();

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

    // Remove all debug boxes
    this.graphicsManager.getScene().children = this.graphicsManager
      .getScene()
      .children.filter(
        (child: THREE.Object3D) => !child.name.startsWith("debugBox_")
      );

    // Remove all ripple meshes from the scene
    this.graphicsManager.getScene().children = this.graphicsManager
      .getScene()
      .children.filter(
        (child: THREE.Object3D) => !child.name.startsWith("ripple_")
      );

    // Remove all water meshes from the scene
    this.graphicsManager.getScene().children = this.graphicsManager
      .getScene()
      .children.filter(
        (child: THREE.Object3D) =>
          child.name !== "waterMesh" &&
          child.name !== "waterDropletMesh" &&
          child.name !== "waterRipple"
      );
  }
}
