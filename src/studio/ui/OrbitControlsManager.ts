import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as THREE from "three";

export class OrbitControlsManager {
  public controls: OrbitControls;
  private controlsEnabled = false;

  constructor(camera: THREE.PerspectiveCamera | THREE.OrthographicCamera, domElement: HTMLElement) {
    this.controls = new OrbitControls(camera, domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.25;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 50;
    this.controls.maxPolarAngle = Math.PI / 2;
    this.controls.enabled = this.controlsEnabled;
  }

  public toggleControls(enabled?: boolean): boolean {
    if (enabled !== undefined) {
      this.controlsEnabled = enabled;
    } else {
      this.controlsEnabled = !this.controlsEnabled;
    }
    this.controls.enabled = this.controlsEnabled;
    return this.controlsEnabled;
  }

  public update(): void {
    if (this.controlsEnabled) {
      this.controls.update();
    }
  }

  public getControlsEnabled(): boolean {
    return this.controlsEnabled;
  }
}
