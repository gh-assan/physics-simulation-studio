import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

/**
 * Manages the Three.js graphics rendering, including scene, camera, and controls.
 *
 * Camera Controls:
 * - Left Click + Drag: Rotate camera around the scene
 * - Right Click + Drag: Pan camera
 * - Scroll Wheel: Zoom in/out
 */
export class ThreeGraphicsManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public controls: OrbitControls;
  private controlsEnabled = false;

  constructor() {
    this.scene = new THREE.Scene();
    // Set a light gray background color for better contrast with objects
    this.scene.background = new THREE.Color(0xcccccc);
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    // Position the camera to get a better view of objects at the origin
    this.camera.position.set(0, 10, 15);
    this.camera.lookAt(0, 0, 0);

    // Initialize OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    // Configure controls
    this.controls.enableDamping = true; // For smoother camera movements
    this.controls.dampingFactor = 0.25;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 5; // Minimum zoom distance
    this.controls.maxDistance = 50; // Maximum zoom distance
    this.controls.maxPolarAngle = Math.PI / 2; // Limit vertical rotation to prevent going below the ground

    // Disable controls by default
    this.controls.enabled = this.controlsEnabled;

    // Add window resize handler
    window.addEventListener("resize", this._handleResize.bind(this));

    this._addLights();
    this._addHelpers();
  }

  private _addLights(): void {
    // Add multiple lights to ensure objects are well-lit from all angles

    // Main point light
    const mainLight = new THREE.PointLight(0xffffff, 1, 100);
    mainLight.position.set(10, 10, 10);
    this.scene.add(mainLight);

    // Secondary point light from opposite direction
    const secondaryLight = new THREE.PointLight(0xffffff, 0.7, 100);
    secondaryLight.position.set(-10, 5, -10);
    this.scene.add(secondaryLight);

    // Ambient light to ensure minimum illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);

    // Directional light to simulate sunlight
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 10, 0);
    directionalLight.lookAt(0, 0, 0);
    this.scene.add(directionalLight);
  }

  private _addHelpers(): void {
    // Add a grid helper to visualize the 3D space
    const gridHelper = new THREE.GridHelper(50, 50, 0x888888, 0x444444);
    this.scene.add(gridHelper);

    // Add axes helper to show the orientation (red=X, green=Y, blue=Z)
    const axesHelper = new THREE.AxesHelper(10);
    this.scene.add(axesHelper);

    // Add a small sphere at the origin for reference
    const originGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const originMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff });
    const originSphere = new THREE.Mesh(originGeometry, originMaterial);
    originSphere.position.set(0, 0, 0);
    this.scene.add(originSphere);
  }

  public render(): void {
    // Update controls (needed for damping) only if enabled
    if (this.controlsEnabled) {
      this.controls.update();
    }

    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Toggles camera controls on or off
   * @param enabled Optional boolean to set the enabled state directly
   * @returns The current enabled state after toggling
   */
  public toggleControls(enabled?: boolean): boolean {
    if (enabled !== undefined) {
      this.controlsEnabled = enabled;
    } else {
      this.controlsEnabled = !this.controlsEnabled;
    }

    this.controls.enabled = this.controlsEnabled;

    return this.controlsEnabled;
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  /**
   * Gets the camera controls
   * @returns The OrbitControls instance
   */
  public getControls(): OrbitControls {
    return this.controls;
  }

  /**
   * Handles window resize events by updating the camera aspect ratio and renderer size
   * @private
   */
  private _handleResize(): void {
    // Update camera aspect ratio
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    // Update renderer size
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /**
   * Gets the current state of camera controls
   * @returns Whether camera controls are currently enabled
   */
  public getControlsEnabled(): boolean {
    return this.controlsEnabled;
  }

  /**
   * Shows or hides the camera control instructions
   * @param show Whether to show the instructions
   */
  public showControlInstructions(show: boolean): void {
    // No longer needed as controls will be managed through the UI panel
  }
}
