import * as THREE from 'three';
import { ISimulationRenderer, ISimulationState } from '../../core/plugin/EnhancedPluginInterfaces';
import { SimulationManager } from '../../studio/simulation/SimulationManager';

/**
 * Solar System Renderer - Handles THREE.js visualization of celestial bodies
 */
export class SolarSystemRenderer implements ISimulationRenderer {
  private simulationManager: SimulationManager | null = null;
  private meshes: Map<number, THREE.Mesh> = new Map();
  private scene: THREE.Scene | null = null;

  initialize(simulationManager: SimulationManager): void {
    this.simulationManager = simulationManager;
    // Get scene reference from the rendering system
    // This would be provided by the SimulationManager
    console.log('🎨 SolarSystemRenderer initialized');
  }

  setScene(scene: THREE.Scene): void {
    this.scene = scene;
  }

  render(state: ISimulationState): void {
    this.updateFromState(state);
  }

  updateFromState(state: ISimulationState): void {
    const bodies = (state as any).bodies;
    if (!bodies || !this.scene) {
      return;
    }

    // Update existing meshes or create new ones
    for (const body of bodies) {
      let mesh = this.meshes.get(body.entityId);

      if (!mesh) {
        mesh = this.createMeshForBody(body);
        this.meshes.set(body.entityId, mesh);
        this.scene.add(mesh);
      }

      // Update position
      mesh.position.set(
        body.position.x / 1e6, // Scale down for visualization
        body.position.y / 1e6,
        body.position.z / 1e6
      );

      // Store body data for debugging
      mesh.userData = {
        entityId: body.entityId,
        type: body.entityId === 1 ? 'sun' : 'planet',
        mass: body.mass,
        radius: body.radius
      };
    }
  }

  dispose(): void {
    // Clean up all meshes
    for (const [entityId, mesh] of this.meshes) {
      if (this.scene) {
        this.scene.remove(mesh);
      }

      // Dispose geometry and material
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(material => material.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    }

    this.meshes.clear();
    console.log('🧹 SolarSystemRenderer disposed');
  }

  private createMeshForBody(body: any): THREE.Mesh {
    // Create geometry based on body radius
    const scaledRadius = Math.max(body.radius / 1e5, 0.1); // Scale and set minimum size
    const geometry = new THREE.SphereGeometry(scaledRadius, 32, 16);

    // Create material based on body type
    let material: THREE.Material;

    if (body.entityId === 1) {
      // Sun - bright yellow/orange with emissive material
      material = new THREE.MeshBasicMaterial({
        color: 0xffaa00
      });
    } else {
      // Planet - blue/earth-like - use basic material for better compatibility
      material = new THREE.MeshBasicMaterial({
        color: 0x6b93d6
      });
    }

    const mesh = new THREE.Mesh(geometry, material);

    // Add some visual enhancements
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
  }

  getMeshes(): ReadonlyMap<number, THREE.Mesh> {
    return this.meshes;
  }
}
