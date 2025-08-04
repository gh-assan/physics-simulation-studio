import { IGraphicsManager } from "./IGraphicsManager";
import * as THREE from "three";
import { CameraManager } from "../../core/graphics/CameraManager";
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
export class ThreeGraphicsManager implements IGraphicsManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
  public renderer: THREE.WebGLRenderer;
  public controlsManager: OrbitControlsManager;
  private controlsEnabled = false;
  private resizeHandler: WindowResizeHandler;
  private cameraManager: CameraManager;

  constructor() {
    this.scene = SceneBuilder.buildScene();
    this.camera = this._initCamera();
    this.renderer = this._initRenderer();
    this.cameraManager = new CameraManager();
    // Sync initial camera state
    this.camera.position.set(
      this.cameraManager.getPosition().x,
      this.cameraManager.getPosition().y,
      this.cameraManager.getPosition().z
    );
    this.camera.lookAt(
      this.cameraManager.getTarget().x,
      this.cameraManager.getTarget().y,
      this.cameraManager.getTarget().z
    );
    if (this.camera instanceof THREE.PerspectiveCamera) {
      this.camera.zoom = this.cameraManager.getZoom();
      this.camera.updateProjectionMatrix();
    }
    this.controlsManager = new OrbitControlsManager(
      this.camera,
      this.renderer.domElement
    );
    this.controlsManager.disable();
    this.resizeHandler = new WindowResizeHandler(this._handleResize.bind(this));
    // Listen for camera changes
    this.cameraManager.onCameraChanged((state) => {
      this.camera.position.set(state.position.x, state.position.y, state.position.z);
      this.camera.lookAt(state.target.x, state.target.y, state.target.z);
      if (this.camera instanceof THREE.PerspectiveCamera) {
        this.camera.zoom = state.zoom;
        this.camera.updateProjectionMatrix();
      }
      this.render();
    });
  }

  public getCameraManager(): CameraManager {
    return this.cameraManager;
  }

  public initialize(container: HTMLElement): void {
    RendererProvider.attachRendererDom(this.renderer, container);
  }

  public add(object: any): void {
    this.scene.add(object);
  }

  public remove(object: any): void {
    this.scene.remove(object);
  }

  /**
   * Encapsulate camera initialization
   */
  private _initCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 30, 60); // Natural, angled view
    camera.lookAt(0, 0, 0);
    return camera;
  }

  /**
   * Encapsulate renderer initialization
   */
  private _initRenderer(): THREE.WebGLRenderer {
    return RendererProvider.createRenderer();
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
      Logger.getInstance().error("Unsupported camera type");
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
   * Small refactor: Use Logger for all error reporting and add a helper for safe disposal
   */
  private _disposeObject3D(obj: THREE.Object3D) {
    try {
      if ((obj as any).geometry && typeof (obj as any).geometry.dispose === 'function') {
        (obj as any).geometry.dispose();
      }
      if ((obj as any).material) {
        if (Array.isArray((obj as any).material)) {
          (obj as any).material.forEach((mat: any) => {
            if (mat && typeof mat.dispose === 'function') mat.dispose();
          });
        } else if (typeof (obj as any).material.dispose === 'function') {
          (obj as any).material.dispose();
        }
      }
    } catch (e) {
      Logger.getInstance().error('Error disposing object:', e);
    }
  }

  /**
   * Disposes the manager, cleaning up resources
   */
  public dispose(): void {
    this.resizeHandler.dispose();
    // Dispose controls if possible
    if (this.controlsManager && typeof this.controlsManager.dispose === 'function') {
      this.controlsManager.dispose();
    }
    // Dispose scene objects
    this.scene.traverse((obj) => {
      this._disposeObject3D(obj);
    });
    // Optionally remove renderer DOM element
    if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }

  public showControlInstructions(show: boolean): void {
    // No longer needed as controls will be managed through the UI panel
  }

  public startRenderingLoop(): void {
    const renderLoop = () => {
      this.render();
      requestAnimationFrame(renderLoop);
    };
    renderLoop();
  }
}
