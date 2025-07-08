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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RenderSystem = void 0;
const THREE = __importStar(require("three"));
const ecs_1 = require("@core/ecs");
const rapier3d_compat_1 = __importDefault(require("@dimforge/rapier3d-compat"));
class RenderSystem extends ecs_1.System {
    constructor() {
        super();
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.raycaster = new THREE.Raycaster();
        this.entityMeshMap = new Map();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x222222);
        this.camera.position.set(0, 10, 20);
        this.camera.lookAt(0, 0, 0);
        // Add some lighting
        const ambientLight = new THREE.AmbientLight(0x404040); // soft white light
        this.scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(1, 1, 1).normalize();
        this.scene.add(directionalLight);
        // Add a ground plane
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x808080, side: THREE.DoubleSide });
        const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
        groundMesh.rotation.x = Math.PI / 2;
        this.scene.add(groundMesh);
        // Initialize Rapier physics world
        const gravity = new rapier3d_compat_1.default.Vector3(0.0, -9.81, 0.0);
        this.physicsWorld = new rapier3d_compat_1.default.World(gravity);
        // Create a static ground collider in Rapier
        const groundColliderDesc = rapier3d_compat_1.default.ColliderDesc.cuboid(50.0, 0.1, 50.0);
        this.physicsWorld.createCollider(groundColliderDesc);
    }
    update(world, deltaTime) {
        // Step the physics world
        this.physicsWorld.step();
        // Synchronize physics bodies with renderable meshes
        const entities = world.componentManager.getEntitiesWithComponents(['PositionComponent', 'RenderableComponent', 'RigidBodyComponent']);
        for (const entityId of entities) {
            const positionComp = world.componentManager.getComponent(entityId, 'PositionComponent');
            const renderableComp = world.componentManager.getComponent(entityId, 'RenderableComponent');
            const rigidBodyComp = world.componentManager.getComponent(entityId, 'RigidBodyComponent');
            const rotationComp = world.componentManager.getComponent(entityId, 'RotationComponent');
            if (positionComp && renderableComp && rigidBodyComp) {
                const mesh = renderableComp.mesh;
                const rigidBody = rigidBodyComp.body;
                const newPosition = rigidBody.translation();
                mesh.position.set(newPosition.x, newPosition.y, newPosition.z);
                positionComp.x = newPosition.x;
                positionComp.y = newPosition.y;
                positionComp.z = newPosition.z;
                const newRotation = rigidBody.rotation();
                mesh.quaternion.set(newRotation.x, newRotation.y, newRotation.z, newRotation.w);
                if (rotationComp) {
                    rotationComp.x = newRotation.x;
                    rotationComp.y = newRotation.y;
                    rotationComp.z = newRotation.z;
                    rotationComp.w = newRotation.w;
                }
            }
        }
        this.renderer.render(this.scene, this.camera);
    }
    addMesh(entityId, mesh) {
        this.scene.add(mesh);
        this.entityMeshMap.set(entityId, mesh);
    }
    getEntityIdFromMesh(mesh) {
        for (const [entityId, storedMesh] of this.entityMeshMap.entries()) {
            if (storedMesh === mesh) {
                return entityId;
            }
        }
        return undefined;
    }
}
exports.RenderSystem = RenderSystem;
