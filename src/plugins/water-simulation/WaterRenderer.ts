import {World} from '@core/ecs/World';
import * as THREE from 'three';
import {WaterBodyComponent} from './WaterComponents';
import {PositionComponent} from '@core/components/PositionComponent';
import {RenderableComponent} from '@core/components/RenderableComponent';

export class WaterRenderer {
  public waterMesh: THREE.Mesh | null = null;
  constructor() {
    console.log('WaterRenderer initialized.');
  }

  render(world: World, scene: THREE.Scene, _camera: THREE.Camera): void {
    const waterBodies = world.componentManager.getEntitiesWithComponents([
      WaterBodyComponent,
      PositionComponent,
      RenderableComponent,
    ]);

    if (waterBodies.length === 0) return;

    const waterBodyEntity = waterBodies[0];
    const waterBodyComponent = world.componentManager.getComponent(
      waterBodyEntity,
      WaterBodyComponent.type,
    ) as WaterBodyComponent;
    const waterBodyPosition = world.componentManager.getComponent(
      waterBodyEntity,
      PositionComponent.name,
    ) as PositionComponent;
    const waterBodyRenderable = world.componentManager.getComponent(
      waterBodyEntity,
      RenderableComponent.name,
    ) as RenderableComponent;

    // Find the water mesh created by RenderSystem
    const waterMesh = scene.children.find(child => {
      // Assuming RenderSystem adds meshes with a specific name or userData
      // For now, we'll try to find a plane with the water body's color
      return (
        child instanceof THREE.Mesh &&
        child.geometry instanceof THREE.PlaneGeometry &&
        (child.material as THREE.MeshBasicMaterial).color.getHex() ===
          new THREE.Color(waterBodyRenderable.color).getHex()
      );
    }) as THREE.Mesh;

    if (!waterMesh) {
      console.warn(
        'WaterRenderer: Could not find water body mesh in scene. Attempting to create a temporary one for debugging.',
      );
      // Fallback for debugging: create a temporary water mesh if not found
      const geometry = new THREE.PlaneGeometry(200, 200, 10, 10); // Increased size
      const material = new THREE.MeshBasicMaterial({
        color: 0x0066ff,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
      });
      const tempWaterMesh = new THREE.Mesh(geometry, material);
      tempWaterMesh.rotation.x = -Math.PI / 2;
      tempWaterMesh.position.set(
        waterBodyPosition.x,
        waterBodyPosition.y,
        waterBodyPosition.z,
      );
      scene.add(tempWaterMesh);
      this.waterMesh = tempWaterMesh;
      // Note: This temporary mesh won't be in RenderSystem's meshes map, so selection won't work on it directly.
      // This is purely for visual confirmation that a plane is being rendered.
      // The actual fix is to ensure RenderSystem creates the mesh.
      return;
    }

    this.waterMesh = waterMesh;

    // Render ripples
    // Remove old ripple meshes (these are temporary and not managed by RenderSystem's meshes map)
    scene.children = scene.children.filter(
      child => !child.name.startsWith('ripple_'),
    );

    waterBodyComponent.ripples.forEach((ripple, index) => {
      const rippleGeometry = new THREE.RingGeometry(
        ripple.radius * 0.8,
        ripple.radius,
        32,
      );
      const rippleMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: ripple.amplitude,
        side: THREE.DoubleSide,
      });
      const rippleMesh = new THREE.Mesh(rippleGeometry, rippleMaterial);
      rippleMesh.rotation.x = -Math.PI / 2;
      rippleMesh.position.set(ripple.x, waterBodyPosition.y + 0.01, ripple.z); // Slightly above water surface
      rippleMesh.name = `ripple_${index}`;
      scene.add(rippleMesh);
    });
  }
}
