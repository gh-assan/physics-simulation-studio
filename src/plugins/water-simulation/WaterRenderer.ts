import { World } from "@core/ecs/World";
import * as THREE from "three";
import { WaterDropletComponent, WaterBodyComponent } from "./WaterComponents";
import { PositionComponent } from "@core/components/PositionComponent";

export class WaterRenderer {
  private instancedMesh: THREE.InstancedMesh | null = null;
  private waterMesh: THREE.Mesh | null = null;
  private rippleMeshes: THREE.Mesh[] = [];
  private dummy = new THREE.Object3D();

  constructor() {}

  render(world: World, scene: THREE.Scene, _camera: THREE.Camera): void {
    // Render water body as a large blue plane at y=0
    const waterEntities = world.componentManager.getEntitiesWithComponents([
      WaterBodyComponent,
      PositionComponent
    ]);
    if (waterEntities.length > 0) {
      const waterEntity = waterEntities[0];
      const waterBody = world.componentManager.getComponent(waterEntity, WaterBodyComponent.type) as WaterBodyComponent;
      const positionComponent = world.componentManager.getComponent(waterEntity, PositionComponent.type) as PositionComponent;
      if (!this.waterMesh) {
        const geometry = new THREE.PlaneGeometry(10, 10);
        const material = new THREE.MeshPhongMaterial({ color: 0x2196f3, transparent: true, opacity: 0.8 });
        this.waterMesh = new THREE.Mesh(geometry, material);
        this.waterMesh.position.set(positionComponent.x, positionComponent.y, positionComponent.z);
        this.waterMesh.rotation.x = -Math.PI / 2;
        scene.add(this.waterMesh);
      }
      // Update ripples
      // Remove old ripple meshes
      for (const mesh of this.rippleMeshes) {
        scene.remove(mesh);
      }
      this.rippleMeshes = [];
      if (waterBody.ripples) {
        for (const ripple of waterBody.ripples) {
          const geometry = new THREE.RingGeometry(ripple.radius - 0.05, ripple.radius, 32);
          const material = new THREE.MeshBasicMaterial({ color: 0x90caf9, transparent: true, opacity: Math.max(0, ripple.amplitude) });
          const mesh = new THREE.Mesh(geometry, material);
          mesh.position.set(ripple.x, positionComponent.y + 0.01, ripple.z);
          mesh.rotation.x = -Math.PI / 2;
          scene.add(mesh);
          this.rippleMeshes.push(mesh);
        }
      }
    }
    const droplets = world.componentManager.getEntitiesWithComponents([
      WaterDropletComponent,
      PositionComponent
    ]);
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
      const geometry = new THREE.SphereGeometry(1, 16, 16); // Smoother sphere
      const material = new THREE.MeshPhongMaterial({ color: 0x90caf9 }); // Light blue
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
        this.dummy.scale.setScalar(dropletComponent.radius.get());
        this.dummy.updateMatrix();
        this.instancedMesh.setMatrixAt(i++, this.dummy.matrix);
      }
    }
    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  unregister(): void {
    if (this.instancedMesh && this.instancedMesh.parent) {
      this.instancedMesh.parent.remove(this.instancedMesh);
      this.instancedMesh.dispose();
      this.instancedMesh = null;
    }
    if (this.waterMesh && this.waterMesh.parent) {
      this.waterMesh.parent.remove(this.waterMesh);
      this.waterMesh.geometry.dispose();
      (this.waterMesh.material as THREE.Material).dispose();
      this.waterMesh = null;
    }
    for (const mesh of this.rippleMeshes) {
      if (mesh.parent) mesh.parent.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    this.rippleMeshes = [];
  }
}
