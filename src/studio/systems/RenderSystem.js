"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RenderSystem = void 0;
const THREE = __importStar(require("three"));
const System_1 = require("../../core/ecs/System");
const PositionComponent_1 = require("../../core/components/PositionComponent");
const RotationComponent_1 = require("../../core/components/RotationComponent");
const RenderableComponent_1 = require("../../core/components/RenderableComponent");
class RenderSystem extends System_1.System {
    constructor() {
        super();
        this.meshes = new Map();
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
        this.camera.position.z = 5;
        // Handle window resizing
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    update(world, deltaTime) {
        const entities = world.componentManager.getEntitiesWithComponents([
            PositionComponent_1.PositionComponent,
            RotationComponent_1.RotationComponent,
            RenderableComponent_1.RenderableComponent
        ]);
        for (const entityId of entities) {
            const position = world.componentManager.getComponent(entityId, PositionComponent_1.PositionComponent.name);
            const rotation = world.componentManager.getComponent(entityId, RotationComponent_1.RotationComponent.name);
            const renderable = world.componentManager.getComponent(entityId, RenderableComponent_1.RenderableComponent.name);
            if (!position || !rotation || !renderable) {
                continue; // Skip if any required component is missing
            }
            let mesh = this.meshes.get(entityId);
            if (!mesh) {
                // Create new mesh if it doesn't exist
                const geometry = this.createGeometry(renderable.geometry);
                const material = new THREE.MeshBasicMaterial({ color: renderable.color });
                mesh = new THREE.Mesh(geometry, material);
                this.scene.add(mesh);
                this.meshes.set(entityId, mesh);
            }
            // Update mesh position and rotation
            mesh.position.set(position.x, position.y, position.z);
            mesh.rotation.setFromQuaternion(new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w));
        }
        this.renderer.render(this.scene, this.camera);
    }
    createGeometry(geometryType) {
        switch (geometryType) {
            case 'box':
                return new THREE.BoxGeometry();
            case 'sphere':
                return new THREE.SphereGeometry();
            case 'cylinder':
                return new THREE.CylinderGeometry();
            case 'cone':
                return new THREE.ConeGeometry();
            case 'plane':
                return new THREE.PlaneGeometry();
            default:
                return new THREE.BoxGeometry(); // Default to box
        }
    }
}
exports.RenderSystem = RenderSystem;
