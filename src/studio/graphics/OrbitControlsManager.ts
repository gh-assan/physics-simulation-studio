import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class OrbitControlsManager {
    private controls: OrbitControls;

    constructor(camera: THREE.Camera, domElement: HTMLElement) {
        this.controls = new OrbitControls(camera, domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.25;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 50;
        this.controls.maxPolarAngle = Math.PI / 2;
    }

    enable() {
        this.controls.enabled = true;
    }

    disable() {
        this.controls.enabled = false;
    }

    update() {
        this.controls.update();
    }

    get instance() {
        return this.controls;
    }
}
