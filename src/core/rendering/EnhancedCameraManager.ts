import {
  IEnhancedCameraManager,
  ICamera,
  CameraType,
  IVector3,
  IMatrix4,
  IOrbitControls,
  IFlyControls,
  ICameraPreset
} from './interfaces';

/**
 * Camera implementation with full matrix operations
 */
export class Camera implements ICamera {
  public position: IVector3 = { x: 0, y: 0, z: 10 };
  public target: IVector3 = { x: 0, y: 0, z: 0 };
  public up: IVector3 = { x: 0, y: 1, z: 0 };
  public fov = 75;
  public aspect = 1;
  public near = 0.1;
  public far = 1000;

  private viewMatrix: Matrix4;
  private projectionMatrix: Matrix4;
  private viewProjectionMatrix: Matrix4;
  private needsUpdate = true;

  constructor(public readonly type: CameraType = CameraType.PERSPECTIVE) {
    this.viewMatrix = new Matrix4();
    this.projectionMatrix = new Matrix4();
    this.viewProjectionMatrix = new Matrix4();
  }

  setPosition(position: IVector3): void {
    this.position = { ...position };
    this.needsUpdate = true;
  }

  setTarget(target: IVector3): void {
    this.target = { ...target };
    this.needsUpdate = true;
  }

  setUp(up: IVector3): void {
    this.up = { ...up };
    this.needsUpdate = true;
  }

  setFOV(fov: number): void {
    this.fov = fov;
    this.needsUpdate = true;
  }

  setAspectRatio(aspect: number): void {
    this.aspect = aspect;
    this.needsUpdate = true;
  }

  setClippingPlanes(near: number, far: number): void {
    this.near = near;
    this.far = far;
    this.needsUpdate = true;
  }

  getViewMatrix(): IMatrix4 {
    if (this.needsUpdate) {
      this.updateMatrices();
    }
    return this.viewMatrix;
  }

  getProjectionMatrix(): IMatrix4 {
    if (this.needsUpdate) {
      this.updateMatrices();
    }
    return this.projectionMatrix;
  }

  getViewProjectionMatrix(): IMatrix4 {
    if (this.needsUpdate) {
      this.updateMatrices();
    }
    return this.viewProjectionMatrix;
  }

  update(): void {
    this.needsUpdate = true;
  }

  private updateMatrices(): void {
    // Update view matrix
    this.viewMatrix.lookAt(this.position, this.target, this.up);

    // Update projection matrix
    if (this.type === CameraType.PERSPECTIVE) {
      this.projectionMatrix.perspective(this.fov, this.aspect, this.near, this.far);
    } else {
      // Orthographic projection
      const height = 10; // Default orthographic height
      const width = height * this.aspect;
      this.projectionMatrix.orthographic(-width, width, -height, height, this.near, this.far);
    }

    // Update view-projection matrix
    this.viewProjectionMatrix.copy(this.projectionMatrix).multiply(this.viewMatrix);

    this.needsUpdate = false;
  }
}

/**
 * Matrix4 implementation for camera calculations
 */
export class Matrix4 implements IMatrix4 {
  public readonly elements: Float32Array;

  constructor() {
    this.elements = new Float32Array(16);
    this.identity();
  }

  set(...elements: number[]): IMatrix4 {
    for (let i = 0; i < 16; i++) {
      this.elements[i] = elements[i] || 0;
    }
    return this;
  }

  identity(): IMatrix4 {
    this.elements[0] = 1; this.elements[4] = 0; this.elements[8] = 0; this.elements[12] = 0;
    this.elements[1] = 0; this.elements[5] = 1; this.elements[9] = 0; this.elements[13] = 0;
    this.elements[2] = 0; this.elements[6] = 0; this.elements[10] = 1; this.elements[14] = 0;
    this.elements[3] = 0; this.elements[7] = 0; this.elements[11] = 0; this.elements[15] = 1;
    return this;
  }

  multiply(matrix: IMatrix4): IMatrix4 {
    const a = this.elements;
    const b = matrix.elements;
    const result = new Float32Array(16);

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        result[i * 4 + j] =
          a[i * 4 + 0] * b[0 * 4 + j] +
          a[i * 4 + 1] * b[1 * 4 + j] +
          a[i * 4 + 2] * b[2 * 4 + j] +
          a[i * 4 + 3] * b[3 * 4 + j];
      }
    }

    for (let i = 0; i < 16; i++) {
      this.elements[i] = result[i];
    }

    return this;
  }

  copy(matrix: IMatrix4): IMatrix4 {
    for (let i = 0; i < 16; i++) {
      this.elements[i] = matrix.elements[i];
    }
    return this;
  }

  clone(): IMatrix4 {
    const cloned = new Matrix4();
    return cloned.copy(this);
  }

  lookAt(eye: IVector3, target: IVector3, up: IVector3): IMatrix4 {
    const zAxis = this.normalize(this.subtract(eye, target));
    const xAxis = this.normalize(this.cross(up, zAxis));
    const yAxis = this.cross(zAxis, xAxis);

    this.elements[0] = xAxis.x;
    this.elements[1] = yAxis.x;
    this.elements[2] = zAxis.x;
    this.elements[3] = 0;

    this.elements[4] = xAxis.y;
    this.elements[5] = yAxis.y;
    this.elements[6] = zAxis.y;
    this.elements[7] = 0;

    this.elements[8] = xAxis.z;
    this.elements[9] = yAxis.z;
    this.elements[10] = zAxis.z;
    this.elements[11] = 0;

    this.elements[12] = -this.dot(xAxis, eye);
    this.elements[13] = -this.dot(yAxis, eye);
    this.elements[14] = -this.dot(zAxis, eye);
    this.elements[15] = 1;

    return this;
  }

  perspective(fov: number, aspect: number, near: number, far: number): IMatrix4 {
    const f = 1.0 / Math.tan((fov * Math.PI / 180) / 2);
    const rangeInv = 1.0 / (near - far);

    this.elements[0] = f / aspect;
    this.elements[1] = 0;
    this.elements[2] = 0;
    this.elements[3] = 0;

    this.elements[4] = 0;
    this.elements[5] = f;
    this.elements[6] = 0;
    this.elements[7] = 0;

    this.elements[8] = 0;
    this.elements[9] = 0;
    this.elements[10] = (near + far) * rangeInv;
    this.elements[11] = -1;

    this.elements[12] = 0;
    this.elements[13] = 0;
    this.elements[14] = near * far * rangeInv * 2;
    this.elements[15] = 0;

    return this;
  }

  orthographic(left: number, right: number, bottom: number, top: number, near: number, far: number): IMatrix4 {
    const w = right - left;
    const h = top - bottom;
    const d = far - near;

    this.elements[0] = 2 / w;
    this.elements[1] = 0;
    this.elements[2] = 0;
    this.elements[3] = 0;

    this.elements[4] = 0;
    this.elements[5] = 2 / h;
    this.elements[6] = 0;
    this.elements[7] = 0;

    this.elements[8] = 0;
    this.elements[9] = 0;
    this.elements[10] = -2 / d;
    this.elements[11] = 0;

    this.elements[12] = -(right + left) / w;
    this.elements[13] = -(top + bottom) / h;
    this.elements[14] = -(far + near) / d;
    this.elements[15] = 1;

    return this;
  }

  // Vector math utilities
  private subtract(a: IVector3, b: IVector3): IVector3 {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  }

  private cross(a: IVector3, b: IVector3): IVector3 {
    return {
      x: a.y * b.z - a.z * b.y,
      y: a.z * b.x - a.x * b.z,
      z: a.x * b.y - a.y * b.x
    };
  }

  private dot(a: IVector3, b: IVector3): number {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }

  private normalize(v: IVector3): IVector3 {
    const length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    if (length === 0) return { x: 0, y: 0, z: 0 };
    return { x: v.x / length, y: v.y / length, z: v.z / length };
  }
}

/**
 * Orbit controls implementation
 */
export class OrbitControls implements IOrbitControls {
  public enabled = true;
  public target: IVector3;
  public distance: number;
  public minDistance = 1;
  public maxDistance = 100;
  public enableZoom = true;
  public enablePan = true;
  public enableRotate = true;

  private spherical = { radius: 10, phi: 0, theta: 0 };
  private camera: ICamera;

  constructor(camera: ICamera, target: IVector3) {
    this.camera = camera;
    this.target = { ...target };
    this.distance = this.calculateDistance();
    this.spherical.radius = this.distance;
    this.updateSpherical();
  }

  update(): void {
    if (!this.enabled) return;

    // Convert spherical coordinates to Cartesian
    const x = this.spherical.radius * Math.sin(this.spherical.phi) * Math.cos(this.spherical.theta);
    const y = this.spherical.radius * Math.cos(this.spherical.phi);
    const z = this.spherical.radius * Math.sin(this.spherical.phi) * Math.sin(this.spherical.theta);

    this.camera.setPosition({
      x: this.target.x + x,
      y: this.target.y + y,
      z: this.target.z + z
    });

    this.camera.setTarget(this.target);
    this.distance = this.spherical.radius;
  }

  reset(): void {
    this.spherical.radius = 10;
    this.spherical.phi = Math.PI / 4;
    this.spherical.theta = 0;
    this.target = { x: 0, y: 0, z: 0 };
    this.update();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  setTarget(target: IVector3): void {
    this.target = { ...target };
  }

  dispose(): void {
    this.enabled = false;
  }

  // Add methods for interaction (would be called by input handlers)
  rotate(deltaTheta: number, deltaPhi: number): void {
    if (!this.enableRotate) return;

    this.spherical.theta += deltaTheta;
    this.spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.spherical.phi + deltaPhi));
  }

  zoom(delta: number): void {
    if (!this.enableZoom) return;

    this.spherical.radius = Math.max(
      this.minDistance,
      Math.min(this.maxDistance, this.spherical.radius + delta)
    );
  }

  pan(deltaX: number, deltaY: number): void {
    if (!this.enablePan) return;

    // Implement panning logic
    const distance = this.calculateDistance();
    const factor = distance * 0.001;

    this.target.x += deltaX * factor;
    this.target.z += deltaY * factor;
  }

  private calculateDistance(): number {
    const dx = this.camera.position.x - this.target.x;
    const dy = this.camera.position.y - this.target.y;
    const dz = this.camera.position.z - this.target.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  private updateSpherical(): void {
    const offset = {
      x: this.camera.position.x - this.target.x,
      y: this.camera.position.y - this.target.y,
      z: this.camera.position.z - this.target.z
    };

    this.spherical.radius = Math.sqrt(offset.x * offset.x + offset.y * offset.y + offset.z * offset.z);
    this.spherical.phi = Math.acos(Math.max(-1, Math.min(1, offset.y / this.spherical.radius)));
    this.spherical.theta = Math.atan2(offset.z, offset.x);
  }
}

/**
 * Enhanced camera manager with advanced features
 */
export class EnhancedCameraManager implements IEnhancedCameraManager {
  private cameras: Map<string, ICamera> = new Map();
  private activeCamera = 'default';
  private presets: Map<string, ICameraPreset> = new Map();
  private controls: Map<string, IOrbitControls | IFlyControls> = new Map();
  private callbacks: Array<(cameraState: any) => void> = [];

  constructor() {
    // Create default camera
    const defaultCamera = this.createCamera(CameraType.PERSPECTIVE, 'default');
    this.setActiveCamera('default');

    // Add default presets
    this.createDefaultPresets();
  }

  // Original ICameraManager methods
  setPosition(position: { x: number; y: number; z: number }): void {
    const camera = this.getActiveCamera();
    camera.setPosition(position);
    this.notifyCallbacks();
  }

  setTarget(target: { x: number; y: number; z: number }): void {
    const camera = this.getActiveCamera();
    camera.setTarget(target);
    this.notifyCallbacks();
  }

  setZoom(distance: number): void {
    const camera = this.getActiveCamera();
    const direction = this.normalize(this.subtract(camera.position, camera.target));
    const newPosition = {
      x: camera.target.x + direction.x * distance,
      y: camera.target.y + direction.y * distance,
      z: camera.target.z + direction.z * distance
    };
    camera.setPosition(newPosition);
    this.notifyCallbacks();
  }

  getPosition(): { x: number; y: number; z: number } {
    return { ...this.getActiveCamera().position };
  }

  getTarget(): { x: number; y: number; z: number } {
    return { ...this.getActiveCamera().target };
  }

  getZoom(): number {
    const camera = this.getActiveCamera();
    return this.distance(camera.position, camera.target);
  }

  onCameraChanged(callback: (cameraState: any) => void): void {
    this.callbacks.push(callback);
  }

  // Enhanced methods
  createCamera(type: CameraType, name = 'camera'): ICamera {
    const camera = new Camera(type);
    this.cameras.set(name, camera);
    return camera;
  }

  getCamera(name?: string): ICamera | any {
    if (name) {
      return this.cameras.get(name);
    }
    return this.getActiveCamera();
  }

  setActiveCamera(name: string): void {
    if (!this.cameras.has(name)) {
      throw new Error(`Camera '${name}' not found`);
    }
    this.activeCamera = name;
    this.notifyCallbacks();
  }

  getActiveCamera(): ICamera {
    const camera = this.cameras.get(this.activeCamera);
    if (!camera) {
      throw new Error(`Active camera '${this.activeCamera}' not found`);
    }
    return camera;
  }

  removeCamera(name: string): void {
    if (name === this.activeCamera) {
      throw new Error('Cannot remove active camera');
    }
    this.cameras.delete(name);
    this.controls.delete(name);
  }

  listCameras(): readonly string[] {
    return Array.from(this.cameras.keys());
  }

  createOrbitControls(camera: ICamera, target: IVector3): IOrbitControls {
    const controls = new OrbitControls(camera, target);
    return controls;
  }

  createFlyControls(camera: ICamera): IFlyControls {
    // Placeholder implementation
    return {
      enabled: true,
      movementSpeed: 1,
      rollSpeed: 0.1,
      autoForward: false,
      dragToLook: false,
      update: () => {},
      setEnabled: () => {},
      dispose: () => {}
    } as IFlyControls;
  }

  applyPreset(preset: ICameraPreset): void {
    const camera = this.getActiveCamera();
    camera.setPosition(preset.position);
    camera.setTarget(preset.target);
    camera.setUp(preset.up);
    camera.setFOV(preset.fov);
    this.notifyCallbacks();
  }

  savePreset(name: string): ICameraPreset {
    const camera = this.getActiveCamera();
    const preset: ICameraPreset = {
      name,
      position: { ...camera.position },
      target: { ...camera.target },
      up: { ...camera.up },
      fov: camera.fov,
      type: camera.type
    };
    this.presets.set(name, preset);
    return preset;
  }

  getPresets(): readonly ICameraPreset[] {
    return Array.from(this.presets.values());
  }

  setFOV(fov: number): void {
    this.getActiveCamera().setFOV(fov);
    this.notifyCallbacks();
  }

  private createDefaultPresets(): void {
    // Front view
    this.presets.set('front', {
      name: 'Front',
      position: { x: 0, y: 0, z: 20 },
      target: { x: 0, y: 0, z: 0 },
      up: { x: 0, y: 1, z: 0 },
      fov: 75,
      type: CameraType.PERSPECTIVE
    });

    // Top view
    this.presets.set('top', {
      name: 'Top',
      position: { x: 0, y: 20, z: 0 },
      target: { x: 0, y: 0, z: 0 },
      up: { x: 0, y: 0, z: -1 },
      fov: 75,
      type: CameraType.PERSPECTIVE
    });

    // Isometric view
    this.presets.set('isometric', {
      name: 'Isometric',
      position: { x: 15, y: 15, z: 15 },
      target: { x: 0, y: 0, z: 0 },
      up: { x: 0, y: 1, z: 0 },
      fov: 75,
      type: CameraType.PERSPECTIVE
    });
  }

  private notifyCallbacks(): void {
    const camera = this.getActiveCamera();
    const state = {
      position: camera.position,
      target: camera.target,
      up: camera.up,
      fov: camera.fov,
      type: camera.type
    };

    this.callbacks.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('Error in camera callback:', error);
      }
    });
  }

  private subtract(a: IVector3, b: IVector3): IVector3 {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  }

  private normalize(v: IVector3): IVector3 {
    const length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    if (length === 0) return { x: 0, y: 0, z: 0 };
    return { x: v.x / length, y: v.y / length, z: v.z / length };
  }

  private distance(a: IVector3, b: IVector3): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
}
