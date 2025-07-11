/**
 * CameraControls.ts
 *
 * Handles camera navigation controls for the 3D viewport, including panning,
 * zooming, and rotating. Integrates with ThreeGraphicsManager and provides
 * methods for common camera operations.
 */

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { ThreeGraphicsManager } from "../graphics/ThreeGraphicsManager";

export enum CameraMode {
  PERSPECTIVE = "perspective",
  ORTHOGRAPHIC = "orthographic"
}

export class CameraControls {
  private graphicsManager: ThreeGraphicsManager;
  private controls: OrbitControls;
  private camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
  private currentMode: CameraMode = CameraMode.PERSPECTIVE;
  private defaultPosition: THREE.Vector3;
  private defaultTarget: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  // Store keyboard state
  private keyState: { [key: string]: boolean } = {};

  constructor(graphicsManager: ThreeGraphicsManager) {
    this.graphicsManager = graphicsManager;
    this.controls = graphicsManager.getControls();
    this.camera = graphicsManager.getCamera();

    // Store the default camera position for reset functionality
    this.defaultPosition = this.camera.position.clone();

    // Configure controls for better user experience
    this.configureControls();

    // Set up keyboard event listeners
    this.setupKeyboardControls();
  }

  /**
   * Configures the OrbitControls for better user experience
   */
  private configureControls(): void {
    // Enable damping for smoother camera movements
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.25;

    // Configure zoom speed
    this.controls.zoomSpeed = 1.0;

    // Configure rotation speed
    this.controls.rotateSpeed = 1.0;

    // Configure pan speed
    this.controls.panSpeed = 1.0;

    // Prevent the camera from going below the ground plane
    this.controls.maxPolarAngle = Math.PI / 2;

    // Set minimum and maximum zoom distances
    this.controls.minDistance = 1;
    this.controls.maxDistance = 100;
  }

  /**
   * Sets up keyboard event listeners for camera controls
   */
  private setupKeyboardControls(): void {
    // Track key state
    window.addEventListener('keydown', (event) => {
      this.keyState[event.key] = true;

      // Handle keyboard shortcuts
      this.handleKeyboardShortcuts(event);
    });

    window.addEventListener('keyup', (event) => {
      this.keyState[event.key] = false;
    });

    // Update camera based on key state in animation loop
    const updateCamera = () => {
      this.handleContinuousKeyboardControls();
      requestAnimationFrame(updateCamera);
    };

    updateCamera();
  }

  /**
   * Handles keyboard shortcuts for camera controls
   */
  private handleKeyboardShortcuts(event: KeyboardEvent): void {
    // Prevent default behavior for our shortcuts
    const shouldPreventDefault = true;

    switch (event.key) {
      case 'r': // Reset camera
        if (!event.ctrlKey && !event.metaKey) {
          this.resetCamera();
          if (shouldPreventDefault) event.preventDefault();
        }
        break;

      case 'p': // Toggle perspective/orthographic
        if (!event.ctrlKey && !event.metaKey) {
          this.toggleCameraMode();
          if (shouldPreventDefault) event.preventDefault();
        }
        break;

      case '0': // Top view
        if (!event.ctrlKey && !event.metaKey) {
          this.setTopView();
          if (shouldPreventDefault) event.preventDefault();
        }
        break;

      case '1': // Front view
        if (!event.ctrlKey && !event.metaKey) {
          this.setFrontView();
          if (shouldPreventDefault) event.preventDefault();
        }
        break;

      case '2': // Side view
        if (!event.ctrlKey && !event.metaKey) {
          this.setSideView();
          if (shouldPreventDefault) event.preventDefault();
        }
        break;

      case '3': // Perspective view
        if (!event.ctrlKey && !event.metaKey) {
          this.setPerspectiveView();
          if (shouldPreventDefault) event.preventDefault();
        }
        break;
    }
  }

  /**
   * Handles continuous keyboard controls for camera movement
   */
  private handleContinuousKeyboardControls(): void {
    const panSpeed = 0.1;
    const rotateSpeed = 0.02;
    const zoomSpeed = 0.1;

    // Pan with arrow keys
    if (this.keyState['ArrowUp']) {
      this.pan(0, panSpeed);
    }
    if (this.keyState['ArrowDown']) {
      this.pan(0, -panSpeed);
    }
    if (this.keyState['ArrowLeft']) {
      this.pan(panSpeed, 0);
    }
    if (this.keyState['ArrowRight']) {
      this.pan(-panSpeed, 0);
    }

    // Rotate with Shift + arrow keys
    if (this.keyState['Shift'] && this.keyState['ArrowUp']) {
      this.rotate(0, -rotateSpeed);
    }
    if (this.keyState['Shift'] && this.keyState['ArrowDown']) {
      this.rotate(0, rotateSpeed);
    }
    if (this.keyState['Shift'] && this.keyState['ArrowLeft']) {
      this.rotate(-rotateSpeed, 0);
    }
    if (this.keyState['Shift'] && this.keyState['ArrowRight']) {
      this.rotate(rotateSpeed, 0);
    }

    // Zoom with + and - keys
    if (this.keyState['+'] || this.keyState['=']) {
      this.zoom(zoomSpeed);
    }
    if (this.keyState['-'] || this.keyState['_']) {
      this.zoom(-zoomSpeed);
    }
  }

  /**
   * Pans the camera
   * @param deltaX Amount to pan horizontally
   * @param deltaY Amount to pan vertically
   */
  public pan(deltaX: number, deltaY: number): void {
    // Create a vector for the pan amount
    const pan = new THREE.Vector3();

    // Get the camera's right vector for horizontal panning
    const right = new THREE.Vector3();
    this.camera.getWorldDirection(right);
    right.cross(this.camera.up).normalize();

    // Get the camera's up vector for vertical panning
    const up = new THREE.Vector3();
    up.copy(this.camera.up).normalize();

    // Calculate the pan amount
    pan.addScaledVector(right, -deltaX);
    pan.addScaledVector(up, deltaY);

    // Apply the pan
    this.camera.position.add(pan);
    (this.controls as any).target.add(pan);

    // Update the controls
    this.controls.update();
  }

  /**
   * Rotates the camera around the target
   * @param deltaX Amount to rotate horizontally
   * @param deltaY Amount to rotate vertically
   */
  public rotate(deltaX: number, deltaY: number): void {
    // Use the OrbitControls' built-in rotation
    (this.controls as any).rotateLeft(deltaX);
    (this.controls as any).rotateUp(deltaY);
    this.controls.update();
  }

  /**
   * Zooms the camera
   * @param delta Amount to zoom (positive = zoom in, negative = zoom out)
   */
  public zoom(delta: number): void {
    // Get the current distance from camera to target
    const distance = this.camera.position.distanceTo((this.controls as any).target);

    // Calculate the new distance based on the zoom factor
    // Using a multiplier approach for smoother zooming
    const zoomFactor = delta > 0 ? 0.8 : 1.25; // Zoom in: reduce distance by 20%, Zoom out: increase by 25%
    const newDistance = distance * zoomFactor;

    // Get the direction vector from target to camera
    const direction = new THREE.Vector3().subVectors(
      this.camera.position,
      (this.controls as any).target
    ).normalize();

    // Calculate the new position
    const newPosition = new THREE.Vector3().addVectors(
      (this.controls as any).target,
      direction.multiplyScalar(newDistance)
    );

    // Update the camera position
    this.camera.position.copy(newPosition);

    // Update the controls
    this.controls.update();

    console.log(`Zoomed camera: delta=${delta}, distance=${distance}, newDistance=${newDistance}`);
  }

  /**
   * Resets the camera to its default position and orientation
   */
  public resetCamera(): void {
    // Reset camera position
    this.camera.position.copy(this.defaultPosition);

    // Reset target
    (this.controls as any).target.copy(this.defaultTarget);

    // Reset camera mode to perspective
    if (this.currentMode !== CameraMode.PERSPECTIVE) {
      this.setCameraMode(CameraMode.PERSPECTIVE);
    }

    // Update the controls
    this.controls.update();
  }

  /**
   * Toggles between perspective and orthographic camera modes
   */
  public toggleCameraMode(): void {
    if (this.currentMode === CameraMode.PERSPECTIVE) {
      this.setCameraMode(CameraMode.ORTHOGRAPHIC);
    } else {
      this.setCameraMode(CameraMode.PERSPECTIVE);
    }
  }

  /**
   * Sets the camera mode
   * @param mode The camera mode to set
   */
  public setCameraMode(mode: CameraMode): void {
    // Store current camera position and target
    const position = this.camera.position.clone();
    const target = (this.controls as any).target.clone();

    if (mode === CameraMode.PERSPECTIVE) {
      // Switch to perspective camera
      this.camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      this.currentMode = CameraMode.PERSPECTIVE;
    } else {
      // Switch to orthographic camera
      const aspectRatio = window.innerWidth / window.innerHeight;
      const frustumSize = 20;
      this.camera = new THREE.OrthographicCamera(
        frustumSize * aspectRatio / -2,
        frustumSize * aspectRatio / 2,
        frustumSize / 2,
        frustumSize / -2,
        0.1,
        1000
      );
      this.currentMode = CameraMode.ORTHOGRAPHIC;
    }

    // Restore camera position and target
    this.camera.position.copy(position);
    this.camera.lookAt(target);

    // Update the graphics manager with the new camera
    this.graphicsManager.setCamera(this.camera);

    // Update the controls with the new camera
    this.controls = new OrbitControls(this.camera, this.graphicsManager.getRenderer().domElement);
    this.configureControls();
    (this.controls as any).target.copy(target);
    this.controls.update();
  }

  /**
   * Sets the camera to top view
   */
  public setTopView(): void {
    this.camera.position.set(0, 20, 0);
    this.controls.update();
  }

  /**
   * Sets the camera to front view
   */
  public setFrontView(): void {
    this.camera.position.set(0, 0, 20);
    this.controls.update();
  }

  /**
   * Sets the camera to side view
   */
  public setSideView(): void {
    this.camera.position.set(20, 0, 0);
    this.controls.update();
  }

  /**
   * Sets the camera to perspective view (isometric-like)
   */
  public setPerspectiveView(): void {
    this.camera.position.set(10, 10, 10);
    this.controls.update();
  }

  /**
   * Gets the current camera mode
   */
  public getCameraMode(): CameraMode {
    return this.currentMode;
  }

  /**
   * Gets the camera controls
   */
  public getControls(): OrbitControls {
    return this.controls;
  }

  /**
   * Gets the camera
   */
  public getCamera(): THREE.Camera {
    return this.camera;
  }
}
