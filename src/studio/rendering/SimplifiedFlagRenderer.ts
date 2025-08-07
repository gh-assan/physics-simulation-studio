import * as THREE from "three";
import { IWorld } from "../../core/ecs/IWorld";
import { FlagComponent } from "../../plugins/flag-simulation/FlagComponent";
import { PoleComponent } from "../../plugins/flag-simulation/PoleComponent";
import { PositionComponent } from "../../core/components/PositionComponent";
import { RenderableComponent } from "../../core/ecs/RenderableComponent";
import { MaterialDisposer } from "../utils/MaterialDisposer";
import { IRenderer } from "./RenderOrchestrator";

/**
 * Simplified, optimized flag renderer with clean architecture
 * 
 * Key improvements:
 * - Single responsibility (flags + poles)
 * - Efficient buffer geometry updates
 * - Minimal object creation during runtime  
 * - Clean lifecycle management
 * - No debug logging in production
 */
export class SimplifiedFlagRenderer implements IRenderer {
  private scene: THREE.Scene;
  private flagMeshes = new Map<number, FlagMesh>();
  private poleMeshes = new Map<number, THREE.Mesh>();
  
  // Reusable materials (shared across instances)
  private flagMaterial: THREE.MeshStandardMaterial;
  private poleMaterial: THREE.MeshStandardMaterial;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    
    // Create shared materials once
    this.flagMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: false,
      metalness: 0.1,
      roughness: 0.5
    });
    
    this.poleMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513, // Brown wood color
      metalness: 0.1,
      roughness: 0.8
    });
  }

  /**
   * Main update method - efficiently updates all flag and pole entities
   */
  update(world: IWorld, deltaTime: number): void {
    this.updateFlagEntities(world);
    this.updatePoleEntities(world);
  }

  /**
   * Update flag entities with optimized geometry updates
   */
  private updateFlagEntities(world: IWorld): void {
    const flagEntities = world.componentManager.getEntitiesWithComponents([
      FlagComponent,
      PositionComponent,
      RenderableComponent,
    ]);

    // Track active entities for cleanup
    const activeEntityIds = new Set(flagEntities);
    
    for (const entityId of flagEntities) {
      const flagComponent = world.componentManager.getComponent(entityId, FlagComponent.type) as FlagComponent;
      const position = world.componentManager.getComponent(entityId, PositionComponent.type) as PositionComponent;
      const renderable = world.componentManager.getComponent(entityId, RenderableComponent.name) as RenderableComponent;

      if (!flagComponent || !position || !renderable) continue;

      let flagMesh = this.flagMeshes.get(entityId);
      
      if (!flagMesh) {
        // Create new flag mesh
        flagMesh = this.createFlagMesh(flagComponent, renderable.color);
        this.scene.add(flagMesh.mesh);
        this.flagMeshes.set(entityId, flagMesh);
      }

      // Efficient geometry update using buffer attributes
      this.updateFlagGeometry(flagMesh, flagComponent);
      
      // Update transform
      flagMesh.mesh.position.set(position.x, position.y, position.z);
    }

    // Clean up removed entities
    for (const [entityId, flagMesh] of this.flagMeshes) {
      if (!activeEntityIds.has(entityId)) {
        this.removeFlagMesh(entityId, flagMesh);
      }
    }
  }

  /**
   * Update pole entities
   */
  private updatePoleEntities(world: IWorld): void {
    const poleEntities = world.componentManager.getEntitiesWithComponents([
      PoleComponent,
      PositionComponent,
    ]);

    const activeEntityIds = new Set(poleEntities);

    for (const entityId of poleEntities) {
      const poleComponent = world.componentManager.getComponent(entityId, PoleComponent.type) as PoleComponent;
      const position = world.componentManager.getComponent(entityId, PositionComponent.type) as PositionComponent;

      if (!poleComponent || !position) continue;

      let poleMesh = this.poleMeshes.get(entityId);
      
      if (!poleMesh) {
        poleMesh = this.createPoleMesh(poleComponent);
        this.scene.add(poleMesh);
        this.poleMeshes.set(entityId, poleMesh);
      }

      // Update pole position
      poleMesh.position.set(
        position.x,
        position.y + poleComponent.height / 2,
        position.z
      );
    }

    // Clean up removed entities
    for (const [entityId, poleMesh] of this.poleMeshes) {
      if (!activeEntityIds.has(entityId)) {
        this.removePoleMesh(entityId, poleMesh);
      }
    }
  }

  /**
   * Create optimized flag mesh with pre-allocated buffers
   */
  private createFlagMesh(flagComponent: FlagComponent, color: string): FlagMesh {
    const geometry = new THREE.BufferGeometry();
    const segmentsX = flagComponent.segmentsX;
    const segmentsY = flagComponent.segmentsY;
    
    // Pre-calculate buffer sizes
    const vertexCount = (segmentsX + 1) * (segmentsY + 1);
    const triangleCount = segmentsX * segmentsY * 2;
    
    // Pre-allocate typed arrays for better performance
    const positions = new Float32Array(vertexCount * 3);
    const uvs = new Float32Array(vertexCount * 2);
    const indices = new Uint16Array(triangleCount * 3);
    
    // Generate UVs (static, computed once)
    for (let y = 0; y <= segmentsY; y++) {
      for (let x = 0; x <= segmentsX; x++) {
        const index = y * (segmentsX + 1) + x;
        uvs[index * 2] = x / segmentsX;
        uvs[index * 2 + 1] = 1 - y / segmentsY; // Flip Y for proper texture mapping
      }
    }
    
    // Generate indices (static, computed once)
    let indexOffset = 0;
    for (let y = 0; y < segmentsY; y++) {
      for (let x = 0; x < segmentsX; x++) {
        const a = y * (segmentsX + 1) + x;
        const b = a + 1;
        const c = a + (segmentsX + 1);
        const d = c + 1;

        // Triangle 1
        indices[indexOffset++] = a;
        indices[indexOffset++] = c;
        indices[indexOffset++] = b;
        
        // Triangle 2
        indices[indexOffset++] = b;
        indices[indexOffset++] = c;
        indices[indexOffset++] = d;
      }
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    
    // Create material with specified color
    const material = this.flagMaterial.clone();
    material.color.setStyle(color);
    
    const mesh = new THREE.Mesh(geometry, material);
    
    return {
      mesh,
      positions,
      segmentsX,
      segmentsY,
      material
    };
  }

  /**
   * Efficiently update flag geometry using buffer attribute updates
   * No object creation during runtime!
   */
  private updateFlagGeometry(flagMesh: FlagMesh, flagComponent: FlagComponent): void {
    const { positions } = flagMesh;
    const points = flagComponent.points;
    
    // Update vertex positions efficiently
    for (let i = 0; i < points.length && i * 3 < positions.length; i++) {
      const point = points[i];
      const offset = i * 3;
      
      positions[offset] = point.position.x;
      positions[offset + 1] = point.position.y;
      positions[offset + 2] = point.position.z;
    }
    
    // Mark buffer for update
    flagMesh.mesh.geometry.attributes.position.needsUpdate = true;
    flagMesh.mesh.geometry.computeVertexNormals();
  }

  /**
   * Create pole mesh with shared material
   */
  private createPoleMesh(poleComponent: PoleComponent): THREE.Mesh {
    const geometry = new THREE.CylinderGeometry(
      poleComponent.radius,
      poleComponent.radius,
      poleComponent.height,
      16 // Reasonable segment count for performance
    );
    
    return new THREE.Mesh(geometry, this.poleMaterial);
  }

  /**
   * Clean up flag mesh and dispose resources
   */
  private removeFlagMesh(entityId: number, flagMesh: FlagMesh): void {
    this.scene.remove(flagMesh.mesh);
    
    // Dispose geometry
    flagMesh.mesh.geometry.dispose();
    
    // Dispose material (cloned material, not shared)
    MaterialDisposer.dispose(flagMesh.material);
    
    this.flagMeshes.delete(entityId);
  }

  /**
   * Clean up pole mesh and dispose resources
   */
  private removePoleMesh(entityId: number, poleMesh: THREE.Mesh): void {
    this.scene.remove(poleMesh);
    poleMesh.geometry.dispose();
    // Note: Don't dispose shared material
    this.poleMeshes.delete(entityId);
  }

  /**
   * Clear all managed objects
   */
  clear(): void {
    // Clear flag meshes
    for (const [entityId, flagMesh] of this.flagMeshes) {
      this.removeFlagMesh(entityId, flagMesh);
    }
    
    // Clear pole meshes
    for (const [entityId, poleMesh] of this.poleMeshes) {
      this.removePoleMesh(entityId, poleMesh);
    }
  }

  /**
   * Dispose all resources including shared materials
   */
  dispose(): void {
    this.clear();
    
    // Dispose shared materials
    MaterialDisposer.dispose(this.flagMaterial);
    MaterialDisposer.dispose(this.poleMaterial);
  }
}

/**
 * Flag mesh data structure for efficient updates
 */
interface FlagMesh {
  mesh: THREE.Mesh;
  positions: Float32Array;
  segmentsX: number;
  segmentsY: number;
  material: THREE.MeshStandardMaterial;
}
