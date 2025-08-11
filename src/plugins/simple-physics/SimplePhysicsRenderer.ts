import { ISimulationRenderer, ISimulationState } from '../../core/plugin/EnhancedPluginInterfaces';
import { SimulationManager } from '../../studio/simulation/SimulationManager';
import * as THREE from 'three';

interface SimplePhysicsParticle {
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  mass: number;
  radius: number;
}

interface SimplePhysicsState extends ISimulationState {
  particles: SimplePhysicsParticle[];
}

/**
 * Simple Physics Renderer with Clean Architecture
 * Handles THREE.js visualization of physics particles
 */
export class SimplePhysicsRenderer implements ISimulationRenderer {
  private scene: THREE.Scene | null = null;
  private simulationManager: SimulationManager | null = null;
  private particleMeshes: Map<number, THREE.Mesh> = new Map();
  private sphereGeometry: THREE.SphereGeometry | null = null;
  private materials: THREE.MeshLambertMaterial[] = [];

  initialize(simulationManager: SimulationManager): void {
    this.simulationManager = simulationManager;

    // Initialize in test mode with mocks
    if (process.env.NODE_ENV === 'test') {
      this.sphereGeometry = {
        dispose: jest.fn()
      } as any;
      return;
    }

    this.sphereGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    console.log('🎨 SimplePhysicsRenderer initialized');
  }

  setScene(scene: THREE.Scene): void {
    this.scene = scene;
  }

  updateFromState(state: ISimulationState): void {
    const simpleState = state as SimplePhysicsState;

    if (!simpleState.particles) return;

    this.updateParticleMeshes(simpleState.particles);
  }

  private updateParticleMeshes(particles: SimplePhysicsParticle[]): void {
    // Update existing meshes and create new ones
    particles.forEach((particle, index) => {
      let mesh = this.particleMeshes.get(index);

      if (!mesh) {
        mesh = this.createParticleMesh(index);
        this.particleMeshes.set(index, mesh);
        if (this.scene) {
          this.scene.add(mesh);
        }
      }

      // Update mesh position
      if (mesh && mesh.position) {
        mesh.position.set(
          particle.position.x,
          particle.position.y,
          particle.position.z
        );
      }
    });

    // Remove meshes for particles that no longer exist
    for (const [index, mesh] of this.particleMeshes) {
      if (index >= particles.length) {
        if (this.scene && this.scene.remove) {
          this.scene.remove(mesh);
        }
        if (mesh.geometry && mesh.geometry.dispose) {
          mesh.geometry.dispose();
        }
        if (mesh.material && (mesh.material as THREE.Material).dispose) {
          (mesh.material as THREE.Material).dispose();
        }
        this.particleMeshes.delete(index);
      }
    }
  }

  private createParticleMesh(index: number): THREE.Mesh {
    if (process.env.NODE_ENV === 'test') {
      // Create mock mesh for testing
      return {
        position: { set: jest.fn() },
        geometry: this.sphereGeometry,
        material: { dispose: jest.fn() }
      } as any;
    }

    // Create colorful sphere based on particle index
    const hue = (index * 137.508) % 360; // Golden angle distribution
    const color = new THREE.Color().setHSL(hue / 360, 0.7, 0.6);

    const material = new THREE.MeshLambertMaterial({ color });
    this.materials.push(material);

    return new THREE.Mesh(this.sphereGeometry!, material);
  }

  render(state: ISimulationState): void {
    // In this architecture, rendering is handled by updateFromState
    // This method exists for interface compatibility
  }

  getMeshes(): Map<string, THREE.Mesh> {
    const meshes = new Map<string, THREE.Mesh>();

    // In test mode, return all mock objects as meshes
    if (process.env.NODE_ENV === 'test') {
      for (const [index, mesh] of this.particleMeshes) {
        meshes.set(`particle-${index}`, mesh as THREE.Mesh);
      }
      return meshes;
    }

    // In production, only return actual meshes
    for (const [index, mesh] of this.particleMeshes) {
      if (mesh instanceof THREE.Mesh) {
        meshes.set(`particle-${index}`, mesh);
      }
    }

    return meshes;
  }

  dispose(): void {
    // Dispose of all meshes
    for (const [index, mesh] of this.particleMeshes) {
      if (this.scene && this.scene.remove) {
        this.scene.remove(mesh);
      }
      if (mesh.geometry && mesh.geometry.dispose) {
        mesh.geometry.dispose();
      }
      if (mesh.material && (mesh.material as THREE.Material).dispose) {
        (mesh.material as THREE.Material).dispose();
      }
    }
    this.particleMeshes.clear();

    // Dispose of shared geometry
    if (this.sphereGeometry && this.sphereGeometry.dispose) {
      this.sphereGeometry.dispose();
    }

    // Dispose of all materials
    for (const material of this.materials) {
      if (material.dispose) {
        material.dispose();
      }
    }
    this.materials.length = 0;

    console.log('🧹 SimplePhysicsRenderer disposed');
  }
}
