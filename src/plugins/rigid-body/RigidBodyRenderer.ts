import {
  ISimulationRenderer,
  ISimulationState
} from '../../core/plugin/EnhancedPluginInterfaces';
import { SimulationManager } from '../../studio/simulation/SimulationManager';
import { Vector3 } from '../../core/utils/Vector3';
import * as THREE from 'three';

interface RigidBody {
  position: Vector3;
  velocity: Vector3;
  angularVelocity: Vector3;
  rotation: Vector3;
  mass: number;
  dimensions: Vector3;
  shape: 'box' | 'sphere';
  restitution: number;
}

interface RigidBodyState extends ISimulationState {
  bodies: RigidBody[];
  gravity: Vector3;
  airDamping: number;
}

/**
 * Rigid Body Physics Renderer with Clean Architecture
 * Handles THREE.js visualization of rigid body simulation
 */
export class RigidBodyRenderer implements ISimulationRenderer {
  private scene: THREE.Scene | null = null;
  private meshes: THREE.Mesh[] = [];
  private groundMesh: THREE.Mesh | null = null;
  private readonly boxMaterial = new THREE.MeshLambertMaterial({
    color: 0x4444ff,
    transparent: true,
    opacity: 0.8
  });
  private readonly sphereMaterial = new THREE.MeshLambertMaterial({
    color: 0xff4444,
    transparent: true,
    opacity: 0.8
  });
  private readonly groundMaterial = new THREE.MeshLambertMaterial({
    color: 0x228B22,
    transparent: true,
    opacity: 0.6
  });

  initialize(simulationManager: SimulationManager): void {
    // In test mode, use mocks
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    console.log('🧱 RigidBodyRenderer initialized');
  }

  setScene(scene: THREE.Scene): void {
    this.scene = scene;
    this.createGround();
  }

  updateFromState(state: ISimulationState): void {
    const rigidBodyState = state as RigidBodyState;
    if (rigidBodyState.bodies) {
      this.updateMeshes(rigidBodyState.bodies);
    }
  }

  private createGround(): void {
    if (!this.scene) return;

    const groundGeometry = new THREE.PlaneGeometry(30, 30);
    this.groundMesh = new THREE.Mesh(groundGeometry, this.groundMaterial);
    this.groundMesh.rotation.x = -Math.PI / 2;
    this.groundMesh.position.y = -5;
    this.scene.add(this.groundMesh);
  }

  render(state: ISimulationState): void {
    if (!this.scene) return;

    const rigidBodyState = state as RigidBodyState;
    const bodies = rigidBodyState.bodies || [];

    // Update mesh count to match body count
    this.updateMeshCount(bodies.length);

    // Update each mesh with corresponding body data
    bodies.forEach((body, index) => {
      if (index < this.meshes.length) {
        const mesh = this.meshes[index];

        // Update position
        mesh.position.set(body.position.x, body.position.y, body.position.z);

        // Update rotation
        mesh.rotation.set(body.rotation.x, body.rotation.y, body.rotation.z);

        // Update scale based on dimensions
        if (body.shape === 'box') {
          mesh.scale.set(body.dimensions.x, body.dimensions.y, body.dimensions.z);
        } else if (body.shape === 'sphere') {
          const radius = body.dimensions.x;
          mesh.scale.set(radius, radius, radius);
        }

        // Update material based on shape
        if (body.shape === 'box' && mesh.material !== this.boxMaterial) {
          mesh.material = this.boxMaterial;
        } else if (body.shape === 'sphere' && mesh.material !== this.sphereMaterial) {
          mesh.material = this.sphereMaterial;
        }
      }
    });
  }

  private updateMeshCount(requiredCount: number): void {
    if (!this.scene) return;

    // Add meshes if we need more
    while (this.meshes.length < requiredCount) {
      const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
      const mesh = new THREE.Mesh(boxGeometry, this.boxMaterial);
      this.meshes.push(mesh);
      this.scene.add(mesh);
    }

    // Remove excess meshes
    while (this.meshes.length > requiredCount) {
      const mesh = this.meshes.pop();
      if (mesh) {
        this.scene.remove(mesh);
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }
      }
    }
  }

  updateMeshes(bodies: RigidBody[]): void {
    this.updateMeshCount(bodies.length);

    bodies.forEach((body, index) => {
      if (index < this.meshes.length) {
        const mesh = this.meshes[index];

        // Create appropriate geometry if needed
        if (body.shape === 'box') {
          if (!(mesh.geometry instanceof THREE.BoxGeometry)) {
            mesh.geometry.dispose();
            mesh.geometry = new THREE.BoxGeometry(1, 1, 1);
            mesh.material = this.boxMaterial;
          }
        } else if (body.shape === 'sphere') {
          if (!(mesh.geometry instanceof THREE.SphereGeometry)) {
            mesh.geometry.dispose();
            mesh.geometry = new THREE.SphereGeometry(1, 16, 16);
            mesh.material = this.sphereMaterial;
          }
        }
      }
    });
  }

  dispose(): void {
    if (this.scene) {
      // Remove and dispose meshes
      this.meshes.forEach(mesh => {
        this.scene!.remove(mesh);
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }
      });

      // Remove and dispose ground
      if (this.groundMesh) {
        this.scene.remove(this.groundMesh);
        if (this.groundMesh.geometry) {
          this.groundMesh.geometry.dispose();
        }
      }
    }

    // Dispose materials
    this.boxMaterial.dispose();
    this.sphereMaterial.dispose();
    this.groundMaterial.dispose();

    this.meshes = [];
    this.groundMesh = null;
    this.scene = null;

    console.log('🧱 RigidBodyRenderer disposed');
  }

  reset(): void {
    // Keep the same meshes but let them be repositioned by the next render call
    console.log('🧱 RigidBodyRenderer reset');
  }

  getMeshCount(): number {
    return this.meshes.length;
  }

  getGroundMesh(): THREE.Mesh | null {
    return this.groundMesh;
  }
}
