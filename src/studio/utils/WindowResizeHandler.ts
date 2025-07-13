import * as THREE from "three";

export class WindowResizeHandler {
  private camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;

  constructor(
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
    renderer: THREE.WebGLRenderer
  ) {
    this.camera = camera;
    this.renderer = renderer;
    window.addEventListener("resize", this.handleResize.bind(this));
  }

  private handleResize(): void {
    if (this.camera instanceof THREE.PerspectiveCamera) {
        this.camera.aspect = window.innerWidth / window.innerHeight;
    }
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  public dispose(): void {
    window.removeEventListener("resize", this.handleResize.bind(this));
  }
}
