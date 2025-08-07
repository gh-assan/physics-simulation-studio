import * as THREE from "three";
import { System } from "../../core/ecs/System";
import { IWorld } from "../../core/ecs/IWorld";
import { PositionComponent } from "../../core/components/PositionComponent";
import { RotationComponent } from "../../core/components/RotationComponent";
import { RenderableComponent } from "../../core/ecs/RenderableComponent";
import { IRenderable } from "../../core/components/IRenderable";
import { ThreeGraphicsManager } from "../../studio/graphics/ThreeGraphicsManager";
import { FlagComponent } from "./FlagComponent";
import { PoleComponent } from "./PoleComponent";
import { MaterialDisposer } from "../../studio/utils/MaterialDisposer";

/**
 * Optimized Flag Renderer System
 * 
 * Combines flag and pole rendering into a single, efficient system.
 * Features:
 * - Efficient buffer geometry updates (no full rebuilds)
 * - Consolidated flag and pole rendering
 * - Clean registration with RenderOrchestrator
 * - Minimal memory allocation during updates
 * - Production-ready (no debug console.log)
 */
export class OptimizedFlagRenderer extends System implements IRenderable {
  private graphicsManager: ThreeGraphicsManager;
  private flagMeshes = new Map<number, THREE.Mesh>();
  private poleMeshes = new Map<number, THREE.Mesh>();
  private renderOrchestrator: any;

  // Pre-allocated arrays to minimize garbage collection
  private readonly tempQuaternion = new THREE.Quaternion();

  constructor(graphicsManager: ThreeGraphicsManager) {
    super();
    this.graphicsManager = graphicsManager;
  }

  public onRegister(world: IWorld): void {
    // Find and register with RenderOrchestrator
    const systems = (world as any).systemManager.systems;
    for (const system of systems) {
      if (system.constructor.name === 'RenderOrchestrator') {
        this.renderOrchestrator = system;
        this.renderOrchestrator.registerRenderer('flag-renderer', {
          update: this.renderEntities.bind(this),
          clear: this.clear.bind(this),
          dispose: this.dispose.bind(this)
        });
        break;
      }
    }
  }

  public onRemove(world: IWorld): void {
    this.renderOrchestrator?.unregisterRenderer('flag-renderer');
    this.dispose();
  }

  public update(world: IWorld, deltaTime: number): void {
    // ECS update - actual rendering handled by RenderOrchestrator
  }

  /**
   * IRenderable interface implementation
   */
  public render(world: IWorld, scene: THREE.Scene, camera: THREE.Camera): void {
    // This method satisfies IRenderable interface but actual rendering is handled by renderEntities
    this.renderEntities(world, 0);
  }

  /**
   * Main rendering method called by RenderOrchestrator
   */
  public renderEntities(world: IWorld, _deltaTime: number): void {
    this.renderFlags(world);
    this.renderPoles(world);
  }

  /**
   * Render all flag entities with optimized updates
   */
  private renderFlags(world: IWorld): void {
    const flagEntities = world.componentManager.getEntitiesWithComponents([
      FlagComponent,
      PositionComponent,
      RotationComponent,
      RenderableComponent,
    ]);

    // Remove meshes for deleted entities
    this.removeDeletedFlagMeshes(flagEntities);

    // Update existing and create new flag meshes
    for (const entityId of flagEntities) {
      const components = this.getFlagComponents(world, entityId);
      if (!components) continue;

      const { flag, position, rotation } = components;
      let mesh = this.flagMeshes.get(entityId);

      if (!mesh) {
        mesh = this.createFlagMesh(flag);
        this.graphicsManager.getScene().add(mesh);
        this.flagMeshes.set(entityId, mesh);
      }

      // Efficiently update mesh
      this.updateFlagMesh(mesh, flag, position, rotation);
    }
  }

  /**
   * Render all pole entities
   */
  private renderPoles(world: IWorld): void {
    const poleEntities = world.componentManager.getEntitiesWithComponents([
      PoleComponent,
      PositionComponent,
    ]);

    // Remove meshes for deleted entities
    this.removeDeletedPoleMeshes(poleEntities);

    // Update existing and create new pole meshes
    for (const entityId of poleEntities) {
      const components = this.getPoleComponents(world, entityId);
      if (!components) continue;

      const { pole, position } = components;
      let mesh = this.poleMeshes.get(entityId);

      if (!mesh) {
        mesh = this.createPoleMesh(pole);
        this.graphicsManager.getScene().add(mesh);
        this.poleMeshes.set(entityId, mesh);
      }

      // Update pole position
      mesh.position.set(position.x, position.y, position.z);
    }
  }

  /**
   * Get flag components with null checking
   */
  private getFlagComponents(world: IWorld, entityId: number) {
    const flag = world.componentManager.getComponent(entityId, FlagComponent.type) as FlagComponent;
    const position = world.componentManager.getComponent(entityId, PositionComponent.type) as PositionComponent;
    const rotation = world.componentManager.getComponent(entityId, RotationComponent.type) as RotationComponent;
    const renderable = world.componentManager.getComponent(entityId, RenderableComponent.name) as RenderableComponent;

    return (flag && position && rotation && renderable) 
      ? { flag, position, rotation, renderable } 
      : null;
  }

  /**
   * Get pole components with null checking
   */
  private getPoleComponents(world: IWorld, entityId: number) {
    const pole = world.componentManager.getComponent(entityId, PoleComponent.type) as PoleComponent;
    const position = world.componentManager.getComponent(entityId, PositionComponent.type) as PositionComponent;

    return (pole && position) ? { pole, position } : null;
  }

  /**
   * Efficiently update flag mesh geometry and transform
   */
  private updateFlagMesh(
    mesh: THREE.Mesh, 
    flag: FlagComponent, 
    position: PositionComponent, 
    rotation: RotationComponent
  ): void {
    // Update geometry using efficient buffer updates
    const positions = mesh.geometry.attributes.position.array as Float32Array;
    flag.points.forEach((point: any, i: number) => {
      const offset = i * 3;
      positions[offset] = point.position.x;
      positions[offset + 1] = point.position.y;
      positions[offset + 2] = point.position.z;
    });

    mesh.geometry.attributes.position.needsUpdate = true;
    mesh.geometry.computeVertexNormals();

    // Update transform using pre-allocated quaternion
    mesh.position.set(position.x, position.y, position.z);
    this.tempQuaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
    mesh.rotation.setFromQuaternion(this.tempQuaternion);
  }

  /**
   * Create optimized flag mesh with proper geometry setup
   */
  private createFlagMesh(flag: FlagComponent): THREE.Mesh {
    const geometry = new THREE.BufferGeometry();
    const segX = flag.segmentsX;
    const segY = flag.segmentsY;
    
    // Create vertex and index arrays
    const vertices: number[] = [];
    const indices: number[] = [];

    // Generate vertices from flag points
    for (let y = 0; y <= segY; y++) {
      for (let x = 0; x <= segX; x++) {
        const idx = y * (segX + 1) + x;
        const point = flag.points[idx];
        vertices.push(point.position.x, point.position.y, point.position.z);
      }
    }

    // Generate indices for triangulated quads
    for (let y = 0; y < segY; y++) {
      for (let x = 0; x < segX; x++) {
        const i0 = y * (segX + 1) + x;
        const i1 = i0 + 1;
        const i2 = i0 + (segX + 1);
        const i3 = i2 + 1;
        indices.push(i0, i2, i1, i1, i2, i3);
      }
    }

    // Set geometry attributes
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    // Create material with texture if available
    const material = flag.textureUrl
      ? new THREE.MeshLambertMaterial({ 
          map: new THREE.TextureLoader().load(flag.textureUrl),
          side: THREE.DoubleSide 
        })
      : new THREE.MeshLambertMaterial({ 
          color: 0x0077ff, 
          side: THREE.DoubleSide 
        });

    return new THREE.Mesh(geometry, material);
  }

  /**
   * Create pole mesh
   */
  private createPoleMesh(pole: PoleComponent): THREE.Mesh {
    const geometry = new THREE.CylinderGeometry(0.05, 0.05, pole.height, 8);
    const material = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    return new THREE.Mesh(geometry, material);
  }

  /**
   * Remove meshes for deleted flag entities
   */
  private removeDeletedFlagMeshes(currentEntities: readonly number[]): void {
    const currentSet = new Set(currentEntities);
    for (const [entityId, mesh] of this.flagMeshes.entries()) {
      if (!currentSet.has(entityId)) {
        this.removeFlagMesh(entityId, mesh);
      }
    }
  }

  /**
   * Remove meshes for deleted pole entities
   */
  private removeDeletedPoleMeshes(currentEntities: readonly number[]): void {
    const currentSet = new Set(currentEntities);
    for (const [entityId, mesh] of this.poleMeshes.entries()) {
      if (!currentSet.has(entityId)) {
        this.removePoleMesh(entityId, mesh);
      }
    }
  }

  /**
   * Clean removal of flag mesh
   */
  private removeFlagMesh(entityId: number, mesh: THREE.Mesh): void {
    this.graphicsManager.getScene().remove(mesh);
    mesh.geometry.dispose();
    MaterialDisposer.dispose(mesh.material);
    this.flagMeshes.delete(entityId);
  }

  /**
   * Clean removal of pole mesh
   */
  private removePoleMesh(entityId: number, mesh: THREE.Mesh): void {
    this.graphicsManager.getScene().remove(mesh);
    mesh.geometry.dispose();
    MaterialDisposer.dispose(mesh.material);
    this.poleMeshes.delete(entityId);
  }

  /**
   * Clear all meshes
   */
  public clear(): void {
    this.flagMeshes.forEach((mesh, entityId) => this.removeFlagMesh(entityId, mesh));
    this.poleMeshes.forEach((mesh, entityId) => this.removePoleMesh(entityId, mesh));
  }

  /**
   * Dispose of all resources
   */
  public dispose(): void {
    this.clear();
  }
}
