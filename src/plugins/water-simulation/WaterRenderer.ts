import { World } from "@core/ecs/World";
import * as THREE from "three";
import { WaterDropletComponent } from "./WaterComponents";
import { PositionComponent } from "@core/components/PositionComponent";

export class WaterRenderer {
  private instancedMesh: THREE.InstancedMesh | null = null;
  private dummy = new THREE.Object3D();

  constructor() {
    console.log("WaterRenderer initialized.");
  }

  render(world: World, scene: THREE.Scene, _camera: THREE.Camera): void {
    console.log("[WaterRenderer] render called.");
    const droplets = world.componentManager.getEntitiesWithComponents([
      WaterDropletComponent,
      PositionComponent
    ]);
    console.log(
      `[WaterRenderer] Found ${droplets.length} droplets for rendering.`
    );

    if (droplets.length === 0) {
      if (this.instancedMesh) {
        scene.remove(this.instancedMesh);
        this.instancedMesh.dispose();
        this.instancedMesh = null;
      }
      return;
    }

    if (!this.instancedMesh || this.instancedMesh.count !== droplets.length) {
      if (this.instancedMesh) {
        scene.remove(this.instancedMesh);
        this.instancedMesh.dispose();
      }
      const geometry = new THREE.SphereGeometry(1, 8, 8); // Basic sphere for droplets
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Bright red color for debugging
      this.instancedMesh = new THREE.InstancedMesh(
        geometry,
        material,
        droplets.length
      );
      scene.add(this.instancedMesh);
    }

    let i = 0;
    for (const entityId of droplets) {
      const dropletComponent = world.componentManager.getComponent(
        entityId,
        WaterDropletComponent.type
      ) as WaterDropletComponent;
      const positionComponent = world.componentManager.getComponent(
        entityId,
        PositionComponent.type
      ) as PositionComponent;

      if (dropletComponent && positionComponent) {
        this.dummy.position.set(
          positionComponent.x,
          positionComponent.y,
          positionComponent.z
        );
        this.dummy.scale.setScalar(dropletComponent.radius.get()); // Scale by droplet radius
        this.dummy.updateMatrix();
        this.instancedMesh.setMatrixAt(i++, this.dummy.matrix);
      }
    }
    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  // No unregister needed for now, as the mesh is disposed in render if no droplets
  unregister(): void {
    // This method is called when the plugin is unregistered
    // Ensure the instanced mesh is removed from the scene and disposed
    if (this.instancedMesh && this.instancedMesh.parent) {
      this.instancedMesh.parent.remove(this.instancedMesh);
      this.instancedMesh.dispose();
      this.instancedMesh = null;
    }
  }
}
