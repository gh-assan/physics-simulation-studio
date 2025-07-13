import * as THREE from "three";
import { SceneBuilder } from "./SceneBuilder";
import { RendererProvider } from "./RendererProvider";
import { OrbitControlsManager } from "./OrbitControlsManager";
import { WindowResizeHandler } from "./WindowResizeHandler";
import { Logger } from "../../core/utils/Logger";
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
  public camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
  public renderer: THREE.WebGLRenderer;
  public controlsManager: OrbitControlsManager;
  private controlsEnabled = false;
  private resizeHandler: WindowResizeHandler;

  constructor() {
    this.scene = SceneBuilder.buildScene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 5, 20);
    this.camera.lookAt(0, 0, 0);
    this.renderer = RendererProvider.createRenderer();
    RendererProvider.attachRendererDom(this.renderer);
    this.controlsManager = new OrbitControlsManager(
      this.camera,
      this.renderer.domElement
    );
    this.controlsManager.disable();
    this.resizeHandler = new WindowResizeHandler(this._handleResize.bind(this));
  }

  public render(): void {
    if (this.controlsEnabled) {
      this.controlsManager.update();
    }
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
    if (this.controlsEnabled) {
      this.controlsManager.enable();
    } else {
      this.controlsManager.disable();
    }

    return this.controlsEnabled;
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public getCamera(): THREE.PerspectiveCamera | THREE.OrthographicCamera {
    return this.camera;
  }

  /**
   * Sets the camera
   * @param camera The camera to set
   */
  public setCamera(camera: THREE.Camera): void {
    if (
      camera instanceof THREE.PerspectiveCamera ||
      camera instanceof THREE.OrthographicCamera
    ) {
      this.camera = camera;
    } else {
      Logger.error("Unsupported camera type");
    }
  }

  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  /**
   * Gets the camera controls
   * @returns The OrbitControls instance
   */
  public getControlsManager(): OrbitControlsManager {
    return this.controlsManager;
  }

  /**
   * Gets the OrbitControls instance for compatibility with existing tests and CameraControls usage
   * @returns The OrbitControls instance
   */
  public get controls(): OrbitControls {
    return this.controlsManager.instance;
  }

  /**
   * Handles window resize events by updating the camera aspect ratio and renderer size
   * @private
   */
  private _handleResize(): void {
    // Update camera aspect ratio
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
   * Disposes the manager, cleaning up resources
   */
  public dispose(): void {
    this.resizeHandler.dispose();
  }

  public showControlInstructions(show: boolean): void {
    // No longer needed as controls will be managed through the UI panel
  }
}
