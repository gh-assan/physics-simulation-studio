/**
 * Enhanced rendering system interfaces for Phase 4
 *
 * This module defines the comprehensive interfaces for the rendering pipeline,
 * camera management, and visual effects system following clean architecture principles.
 */

export interface IRenderPipeline {
  /**
   * Initialize the render pipeline
   */
  initialize(): Promise<void>;

  /**
   * Begin rendering frame
   */
  beginFrame(): void;

  /**
   * End rendering frame
   */
  endFrame(): void;

  /**
   * Set active camera
   */
  setCamera(camera: ICamera): void;

  /**
   * Set render target
   */
  setRenderTarget(target: IRenderTarget | null): void;

  /**
   * Execute render pass
   */
  executePass(pass: IRenderPass): void;

  /**
   * Get rendering statistics
   */
  getStats(): IRenderStats;

  /**
   * Dispose resources
   */
  dispose(): void;
}

export interface IRenderPass {
  readonly name: string;
  readonly priority: number;
  readonly enabled: boolean;

  /**
   * Execute the render pass
   */
  execute(context: IRenderPassContext): void;

  /**
   * Check if pass should execute
   */
  shouldExecute(context: IRenderPassContext): boolean;

  /**
   * Get render dependencies
   */
  getDependencies(): readonly string[];
}

export interface IRenderPassContext {
  readonly camera: ICamera;
  readonly renderTarget: IRenderTarget | null;
  readonly time: number;
  readonly deltaTime: number;
  readonly frameNumber: number;
  readonly viewport: IViewport;
  readonly scene: IScene;
}

export interface IRenderTarget {
  readonly width: number;
  readonly height: number;
  readonly format: RenderTargetFormat;
  readonly samples: number;

  /**
   * Bind render target
   */
  bind(): void;

  /**
   * Unbind render target
   */
  unbind(): void;

  /**
   * Get color texture
   */
  getColorTexture(index?: number): ITexture;

  /**
   * Get depth texture
   */
  getDepthTexture(): ITexture;

  /**
   * Resize render target
   */
  resize(width: number, height: number): void;

  /**
   * Dispose render target
   */
  dispose(): void;
}

export enum RenderTargetFormat {
  RGBA8 = 'rgba8',
  RGBA16F = 'rgba16f',
  RGBA32F = 'rgba32f',
  RGB8 = 'rgb8',
  RG8 = 'rg8',
  R8 = 'r8',
  DEPTH24 = 'depth24',
  DEPTH32F = 'depth32f'
}

export interface ITexture {
  readonly width: number;
  readonly height: number;
  readonly format: TextureFormat;
  readonly handle: any; // Platform-specific texture handle

  /**
   * Update texture data
   */
  updateData(data: ArrayBuffer | ArrayBufferView): void;

  /**
   * Generate mipmaps
   */
  generateMipmaps(): void;

  /**
   * Dispose texture
   */
  dispose(): void;
}

export enum TextureFormat {
  RGBA8 = 'rgba8',
  RGBA16F = 'rgba16f',
  RGBA32F = 'rgba32f',
  RGB8 = 'rgb8',
  RG8 = 'rg8',
  R8 = 'r8',
  DEPTH24 = 'depth24'
}

export interface ICamera {
  readonly type: CameraType;
  readonly position: IVector3;
  readonly target: IVector3;
  readonly up: IVector3;
  readonly fov: number;
  readonly aspect: number;
  readonly near: number;
  readonly far: number;

  /**
   * Set camera position
   */
  setPosition(position: IVector3): void;

  /**
   * Set camera target
   */
  setTarget(target: IVector3): void;

  /**
   * Set camera up vector
   */
  setUp(up: IVector3): void;

  /**
   * Set field of view (for perspective cameras)
   */
  setFOV(fov: number): void;

  /**
   * Set aspect ratio
   */
  setAspectRatio(aspect: number): void;

  /**
   * Set near/far planes
   */
  setClippingPlanes(near: number, far: number): void;

  /**
   * Get view matrix
   */
  getViewMatrix(): IMatrix4;

  /**
   * Get projection matrix
   */
  getProjectionMatrix(): IMatrix4;

  /**
   * Get view-projection matrix
   */
  getViewProjectionMatrix(): IMatrix4;

  /**
   * Update camera matrices
   */
  update(): void;
}

export enum CameraType {
  PERSPECTIVE = 'perspective',
  ORTHOGRAPHIC = 'orthographic'
}

export interface IVector3 {
  x: number;
  y: number;
  z: number;
}

export interface IMatrix4 {
  readonly elements: Float32Array;

  /**
   * Set matrix elements
   */
  set(...elements: number[]): IMatrix4;

  /**
   * Make identity matrix
   */
  identity(): IMatrix4;

  /**
   * Multiply with another matrix
   */
  multiply(matrix: IMatrix4): IMatrix4;

  /**
   * Copy matrix
   */
  copy(matrix: IMatrix4): IMatrix4;

  /**
   * Clone matrix
   */
  clone(): IMatrix4;
}

export interface IViewport {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface IScene {
  /**
   * Add renderable object to scene
   */
  add(object: IRenderableObject): void;

  /**
   * Remove renderable object from scene
   */
  remove(object: IRenderableObject): void;

  /**
   * Get all renderable objects
   */
  getRenderables(): readonly IRenderableObject[];

  /**
   * Clear scene
   */
  clear(): void;

  /**
   * Update scene
   */
  update(deltaTime: number): void;
}

export interface IRenderableObject {
  readonly id: EntityId;
  readonly transform: ITransform;
  readonly material: IMaterial;
  readonly geometry: IGeometry;
  readonly visible: boolean;
  readonly renderOrder: number;

  /**
   * Update object
   */
  update(deltaTime: number): void;

  /**
   * Set visibility
   */
  setVisible(visible: boolean): void;

  /**
   * Set render order
   */
  setRenderOrder(order: number): void;

  /**
   * Get bounding box
   */
  getBoundingBox(): IBoundingBox;

  /**
   * Dispose object resources
   */
  dispose(): void;
}

export interface ITransform {
  position: IVector3;
  rotation: IVector3;
  scale: IVector3;

  /**
   * Get world matrix
   */
  getWorldMatrix(): IMatrix4;

  /**
   * Set from matrix
   */
  setFromMatrix(matrix: IMatrix4): void;

  /**
   * Reset transform
   */
  reset(): void;
}

export interface IMaterial {
  readonly name: string;
  readonly type: MaterialType;
  readonly properties: Record<string, any>;

  /**
   * Set material property
   */
  setProperty(name: string, value: any): void;

  /**
   * Get material property
   */
  getProperty(name: string): any;

  /**
   * Update material
   */
  update(): void;

  /**
   * Clone material
   */
  clone(): IMaterial;

  /**
   * Dispose material
   */
  dispose(): void;
}

export enum MaterialType {
  BASIC = 'basic',
  PHONG = 'phong',
  PBR = 'pbr',
  CUSTOM = 'custom'
}

export interface IGeometry {
  readonly vertices: Float32Array;
  readonly indices?: Uint16Array | Uint32Array;
  readonly attributes: Map<string, IVertexAttribute>;

  /**
   * Update geometry data
   */
  updateVertices(vertices: Float32Array): void;

  /**
   * Update indices
   */
  updateIndices(indices: Uint16Array | Uint32Array): void;

  /**
   * Set vertex attribute
   */
  setAttribute(name: string, attribute: IVertexAttribute): void;

  /**
   * Get vertex attribute
   */
  getAttribute(name: string): IVertexAttribute | undefined;

  /**
   * Get bounding box
   */
  getBoundingBox(): IBoundingBox;

  /**
   * Dispose geometry
   */
  dispose(): void;
}

export interface IVertexAttribute {
  readonly buffer: Float32Array;
  readonly itemSize: number;
  readonly normalized: boolean;
  readonly usage: BufferUsage;

  /**
   * Update attribute data
   */
  updateData(data: Float32Array): void;
}

export enum BufferUsage {
  STATIC = 'static',
  DYNAMIC = 'dynamic',
  STREAM = 'stream'
}

export interface IBoundingBox {
  min: IVector3;
  max: IVector3;

  /**
   * Check if point is inside
   */
  containsPoint(point: IVector3): boolean;

  /**
   * Check if intersects with another box
   */
  intersectsBox(box: IBoundingBox): boolean;

  /**
   * Get center point
   */
  getCenter(): IVector3;

  /**
   * Get size
   */
  getSize(): IVector3;

  /**
   * Expand by point
   */
  expandByPoint(point: IVector3): void;

  /**
   * Reset bounding box
   */
  reset(): void;
}

export interface IRenderStats {
  readonly frameTime: number;
  readonly fps: number;
  readonly drawCalls: number;
  readonly triangles: number;
  readonly vertices: number;
  readonly memoryUsage: number;
}

/**
 * Enhanced camera manager with advanced features
 */
export interface IEnhancedCameraManager extends ICameraManager {
  /**
   * Create new camera
   */
  createCamera(type: CameraType, name?: string): ICamera;

  /**
   * Get camera by name
   */
  getCamera(name: string): ICamera | undefined;

  /**
   * Set active camera
   */
  setActiveCamera(name: string): void;

  /**
   * Get active camera
   */
  getActiveCamera(): ICamera;

  /**
   * Remove camera
   */
  removeCamera(name: string): void;

  /**
   * List all cameras
   */
  listCameras(): readonly string[];

  /**
   * Create orbital controls
   */
  createOrbitControls(camera: ICamera, target: IVector3): IOrbitControls;

  /**
   * Create fly controls
   */
  createFlyControls(camera: ICamera): IFlyControls;

  /**
   * Set camera preset
   */
  applyPreset(preset: ICameraPreset): void;

  /**
   * Save camera preset
   */
  savePreset(name: string): ICameraPreset;

  /**
   * Get camera presets
   */
  getPresets(): readonly ICameraPreset[];
}

export interface IOrbitControls {
  readonly enabled: boolean;
  readonly target: IVector3;
  readonly distance: number;
  readonly minDistance: number;
  readonly maxDistance: number;
  readonly enableZoom: boolean;
  readonly enablePan: boolean;
  readonly enableRotate: boolean;

  /**
   * Update controls
   */
  update(): void;

  /**
   * Reset controls
   */
  reset(): void;

  /**
   * Enable/disable controls
   */
  setEnabled(enabled: boolean): void;

  /**
   * Set target position
   */
  setTarget(target: IVector3): void;

  /**
   * Dispose controls
   */
  dispose(): void;
}

export interface IFlyControls {
  readonly enabled: boolean;
  readonly movementSpeed: number;
  readonly rollSpeed: number;
  readonly autoForward: boolean;
  readonly dragToLook: boolean;

  /**
   * Update controls
   */
  update(deltaTime: number): void;

  /**
   * Enable/disable controls
   */
  setEnabled(enabled: boolean): void;

  /**
   * Dispose controls
   */
  dispose(): void;
}

export interface ICameraPreset {
  readonly name: string;
  readonly position: IVector3;
  readonly target: IVector3;
  readonly up: IVector3;
  readonly fov: number;
  readonly type: CameraType;
}

/**
 * Visual effects system interface
 */
export interface IEffectsManager {
  /**
   * Add post-processing effect
   */
  addEffect(effect: IPostProcessEffect): void;

  /**
   * Remove post-processing effect
   */
  removeEffect(name: string): void;

  /**
   * Get effect by name
   */
  getEffect(name: string): IPostProcessEffect | undefined;

  /**
   * Set effect enabled
   */
  setEffectEnabled(name: string, enabled: boolean): void;

  /**
   * Process effects
   */
  process(input: IRenderTarget, output: IRenderTarget | null): void;

  /**
   * Clear all effects
   */
  clear(): void;

  /**
   * Dispose effects manager
   */
  dispose(): void;
}

export interface IPostProcessEffect {
  readonly name: string;
  readonly enabled: boolean;
  readonly priority: number;

  /**
   * Initialize effect
   */
  initialize(): void;

  /**
   * Process effect
   */
  process(input: IRenderTarget, output: IRenderTarget | null, context: IRenderPassContext): void;

  /**
   * Set effect parameter
   */
  setParameter(name: string, value: any): void;

  /**
   * Get effect parameter
   */
  getParameter(name: string): any;

  /**
   * Dispose effect
   */
  dispose(): void;
}

// Import the original ICameraManager for compatibility
import { ICameraManager } from '../graphics/interfaces/ICameraManager';
import { EntityId } from '../simulation/interfaces';
