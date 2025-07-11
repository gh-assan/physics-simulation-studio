import * as THREE from "three";
import { System } from "../../core/ecs/System";
import { World } from "../../core/ecs/World";
import { PositionComponent } from "../../core/components/PositionComponent";
import { RotationComponent } from "../../core/components/RotationComponent";
import { RenderableComponent } from "../../core/components/RenderableComponent";
import { Studio } from "../Studio"; // Import Studio
import { WaterRenderer } from "../../plugins/water-simulation/WaterRenderer"; // Import WaterRenderer
import { SelectableComponent } from "../../core/components/SelectableComponent"; // Import SelectableComponent
import { createGeometry, disposeThreeJsObject } from "../utils/ThreeJsUtils";
import { ThreeGraphicsManager } from "../graphics/ThreeGraphicsManager";
import { createPoleMesh, createFlagMesh } from "../../plugins/flag-simulation/FlagRenderer"; // Import createPoleMesh and createFlagMesh
import { FlagComponent } from "../../plugins/flag-simulation/FlagComponent"; // Import FlagComponent
import { PoleComponent } from "../../plugins/flag-simulation/PoleComponent"; // Import PoleComponent

export class RenderSystem extends System {
  private graphicsManager: ThreeGraphicsManager;
  private meshes: Map<number, THREE.Mesh> = new Map();
  private poleMeshes: Map<number, THREE.Mesh> = new Map(); // New map for pole meshes
  private studio: Studio; // Add studio reference
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  constructor(studio: Studio) {
    super();
    this.studio = studio;

    this.graphicsManager = new ThreeGraphicsManager();

    // Setup raycaster for object selection
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    window.addEventListener("mousedown", this.onMouseDown.bind(this), false);

    // Listen for parameter changes to update rendering without starting simulation
    window.addEventListener(
      "parameter-changed",
      this.onParameterChanged.bind(this),
      false
    );
  }

  private onParameterChanged(event: CustomEvent): void {
    // Force a render update without starting the simulation
    if (!this.studio.getIsPlaying()) {
      // Only update rendering if simulation is not already playing
      const world = this.studio.world;
      this.update(world, 0); // Update with zero deltaTime to avoid physics simulation
      this.graphicsManager.render();
    }
  }

  private onMouseDown(event: MouseEvent): void {
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
    const world = this.studio.world;

    // Deselect all currently selected entities
    const currentlySelected = world.componentManager
      .getEntitiesWithComponents([SelectableComponent])
      .filter((entityId) => {
        const selectable = world.componentManager.getComponent(
          entityId,
          SelectableComponent.name
        ) as SelectableComponent;
        return selectable.isSelected;
      });

    currentlySelected.forEach((entityId) => {
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

  public update(world: World, _deltaTime: number): void {
    // console.log("RenderSystem update called.");
    const entities = world.componentManager.getEntitiesWithComponents([
      PositionComponent,
      RotationComponent,
      RenderableComponent
    ]);

    // console.log(`Found ${entities.length} general entities.`);

    for (const entityId of entities) {
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

      if (!position || !rotation || !renderable) {
        continue; // Skip if any required component is missing
      }

      // Skip flag entities - they will be handled by the FlagRenderer
      // Check if FlagComponent is defined before trying to use it
      try {
        if (
          FlagComponent &&
          world.componentManager.hasComponent(entityId, FlagComponent.type)
        ) {
          // Handle flag rendering directly here
          const flagComponent = world.componentManager.getComponent(entityId, FlagComponent.type) as FlagComponent;
          if (flagComponent && flagComponent.points && flagComponent.points.length > 0) {
            let flagMesh = this.meshes.get(entityId);
            if (!flagMesh) {
              flagMesh = createFlagMesh(flagComponent);
              this.graphicsManager.getScene().add(flagMesh);
              this.meshes.set(entityId, flagMesh);
              console.log("[RenderSystem] Added new flag mesh to scene:", flagMesh);
            } else {
              // Update existing flag mesh positions
              const positions = flagMesh.geometry.attributes.position.array as Float32Array; // Directly use TypedArray
              flagComponent.points.forEach((p, i) => {
                positions[i * 3] = p.position.x;
                positions[i * 3 + 1] = p.position.y;
                positions[i * 3 + 2] = p.position.z;
              });
              flagMesh.geometry.attributes.position.needsUpdate = true;
              flagMesh.geometry.computeVertexNormals();
              console.log("[RenderSystem] Updated existing flag mesh positions for entity:", entityId);
            }
          }
          continue;
        }
      } catch (e) {
        // FlagComponent might not be available if flag-simulation plugin is not loaded
        // Just continue with normal rendering
        console.error("[RenderSystem] Error handling FlagComponent:", e);
      }

      let mesh = this.meshes.get(entityId);

      if (!mesh) {
        // Create new mesh if it doesn't exist
        const geometry = createGeometry(renderable.geometry);
        const material = new THREE.MeshBasicMaterial({
          color: renderable.color
        });
        mesh = new THREE.Mesh(geometry, material);
        this.graphicsManager.getScene().add(mesh);
        this.meshes.set(entityId, mesh);
      }

      // Update mesh position and rotation
      mesh.position.set(position.x, position.y, position.z);
      mesh.rotation.setFromQuaternion(
        new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w)
      );

      // Handle selection highlight
      const selectable = world.componentManager.getComponent(
        entityId,
        SelectableComponent.name
      ) as SelectableComponent;
      if (selectable) {
        const material = mesh.material as THREE.MeshBasicMaterial;
        if (selectable.isSelected) {
          material.color.set(0xffff00); // Highlight color (yellow)
        } else {
          material.color.set(renderable.color); // Original color
        }
      }
    }

    // Render PoleComponents
    const poleEntities = world.componentManager.getEntitiesWithComponents([
      PoleComponent
    ]);

    for (const entityId of poleEntities) {
      const poleComponent = world.componentManager.getComponent(
        entityId,
        PoleComponent.type
      ) as PoleComponent;

      if (!poleComponent) {
        continue;
      }

      let poleMesh = this.poleMeshes.get(entityId);

      if (!poleMesh) {
        poleMesh = createPoleMesh(poleComponent);
        this.graphicsManager.getScene().add(poleMesh);
        this.poleMeshes.set(entityId, poleMesh);
      }

      // Update pole mesh position (only if it changes, or if it's dynamic)
      // For now, assuming pole position is static after creation, but can be updated here if needed
      poleMesh.position.set(poleComponent.position.x, poleComponent.position.y + poleComponent.height / 2, poleComponent.position.z);
    }

    // Update the FlagRenderer to handle flag entities if available
    // Initialize FlagRenderer if needed and if FlagComponent is available
    try {
      if (FlagComponent) {
        console.log("[RenderSystem] FlagComponent is available");
        // The flag mesh is created and updated directly within this system
        // No separate FlagRenderer class is used for rendering the flag mesh itself
      } else {
        console.log("[RenderSystem] FlagComponent is not available");
      }
    } catch (e) {
      console.error("[RenderSystem] Error updating FlagRenderer:", e);
      // FlagComponent might not be available if flag-simulation plugin is not loaded
      // Skip flag rendering
    }

    // Call plugin-specific renderer if available
    const activeRenderer = this.studio.getRenderer();
    if (activeRenderer instanceof WaterRenderer) {
      activeRenderer.render(
        world,
        this.graphicsManager.getScene(),
        this.graphicsManager.getCamera()
      );
    }

    this.graphicsManager.render();
    console.log(
      "RenderSystem: Scene children after rendering:",
      this.graphicsManager.getScene().children
    );
  }

  /**
   * Gets the graphics manager used by this render system
   * @returns The ThreeGraphicsManager instance
   */
  public getGraphicsManager(): ThreeGraphicsManager {
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

    // Clear pole meshes
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

    // Dispose of water mesh if it exists
    const activeRenderer = this.studio.getRenderer();
    if (activeRenderer instanceof WaterRenderer && activeRenderer.waterMesh) {
      this.graphicsManager.getScene().remove(activeRenderer.waterMesh);
      activeRenderer.waterMesh.geometry.dispose();
      if (activeRenderer.waterMesh.material instanceof THREE.Material) {
        activeRenderer.waterMesh.material.dispose();
      } else if (Array.isArray(activeRenderer.waterMesh.material)) {
        activeRenderer.waterMesh.material.forEach((material) =>
          material.dispose()
        );
      }
      activeRenderer.waterMesh = null; // Reset the reference
    }

    // Remove all ripple meshes from the scene
    this.graphicsManager.getScene().children = this.graphicsManager
      .getScene()
      .children.filter(
        (child: THREE.Object3D) => !child.name.startsWith("ripple_")
      );
  }
}
