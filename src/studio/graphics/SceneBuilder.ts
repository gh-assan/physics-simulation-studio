import * as THREE from "three";

export class SceneBuilder {
  public static createScene(): THREE.Scene {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xcccccc);
    this.addLights(scene);
    this.addHelpers(scene);
    return scene;
  }

  public static buildScene(): THREE.Scene {
    return this.createScene();
  }

  private static addLights(scene: THREE.Scene): void {
    const mainLight = new THREE.PointLight(0xffffff, 1, 100);
    mainLight.position.set(10, 10, 10);
    scene.add(mainLight);

    const secondaryLight = new THREE.PointLight(0xffffff, 0.7, 100);
    secondaryLight.position.set(-10, 5, -10);
    scene.add(secondaryLight);

    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 10, 0);
    directionalLight.lookAt(0, 0, 0);
    scene.add(directionalLight);
  }

  private static addHelpers(scene: THREE.Scene): void {
    const gridHelper = new THREE.GridHelper(50, 50, 0x888888, 0x444444);
    gridHelper.name = "grid";
    scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(10);
    axesHelper.name = "axes";
    scene.add(axesHelper);

    const originGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const originMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff });
    const originSphere = new THREE.Mesh(originGeometry, originMaterial);
    originSphere.position.set(0, 0, 0);
    originSphere.name = "origin";
    scene.add(originSphere);
  }
}
