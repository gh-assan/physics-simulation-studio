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
exports.UIManager = void 0;
const tweakpane_1 = require("tweakpane");
const THREE = __importStar(require("three"));
const components_1 = require("@core/components");
const components_2 = require("@plugins/rigid-body/components");
const rapier3d_compat_1 = __importDefault(require("@dimforge/rapier3d-compat"));
class UIManager {
    constructor(world, renderSystem) {
        this.world = world;
        this.renderSystem = renderSystem;
        this.appContainer = document.getElementById('app-container');
        this.viewportContainer = document.getElementById('viewport-container');
        this.tweakpaneContainer = document.getElementById('tweakpane-container');
        this.sceneGraphContainer = document.getElementById('scene-graph-container');
        this.playButton = document.getElementById('play-button');
        this.pauseButton = document.getElementById('pause-button');
        this.resetButton = document.getElementById('reset-button');
        this.addBoxButton = document.getElementById('add-box-button');
        this.addSphereButton = document.getElementById('add-sphere-button');
        this.pane = new tweakpane_1.Pane({
            container: this.tweakpaneContainer,
        });
        this.setupEventListeners();
        this.setupViewport();
        this.setupTweakpane();
    }
    setupEventListeners() {
        this.playButton.addEventListener('click', () => this.onPlay());
        this.pauseButton.addEventListener('click', () => this.onPause());
        this.resetButton.addEventListener('click', () => this.onReset());
        this.addBoxButton.addEventListener('click', () => this.onAddBox());
        this.addSphereButton.addEventListener('click', () => this.onAddSphere());
        window.addEventListener('resize', () => this.onWindowResize());
        this.viewportContainer.addEventListener('click', (event) => this.onViewportClick(event));
    }
    setupViewport() {
        this.viewportContainer.appendChild(this.renderSystem.renderer.domElement);
        this.onWindowResize(); // Initial size setup
    }
    setupTweakpane() {
        // Initial Tweakpane setup, will be populated dynamically
    }
    clearControls() {
        if (this.pane) {
            this.pane.dispose();
        }
        this.pane = new tweakpane_1.Pane({
            container: this.tweakpaneContainer,
        });
    }
    registerComponentControls(componentName, component) {
        const componentFolder = this.pane.addFolder({ title: componentName });
        for (const key in component) {
            if (key.startsWith('_') || typeof component[key] === 'function') {
                continue;
            }
            const value = component[key];
            if (typeof value === 'number') {
                componentFolder.addBinding(component, key, {
                    min: -100,
                    max: 100,
                    step: 0.1,
                    label: key,
                }).on('change', () => {
                    // Update the corresponding component in the ECS
                    this.world.componentManager.updateComponent(this.getSelectedEntityId(), componentName, component);
                });
            }
            else if (typeof value === 'boolean') {
                componentFolder.addBinding(component, key, {
                    label: key,
                }).on('change', () => {
                    this.world.componentManager.updateComponent(this.getSelectedEntityId(), componentName, component);
                });
            }
            else if (typeof value === 'string') {
                componentFolder.addBinding(component, key, {
                    label: key,
                }).on('change', () => {
                    this.world.componentManager.updateComponent(this.getSelectedEntityId(), componentName, component);
                });
            }
        }
    }
    getSelectedEntityId() {
        const selectableEntities = this.world.componentManager.getEntitiesWithComponents(['SelectableComponent']);
        for (const entityId of selectableEntities) {
            const selectableComp = this.world.componentManager.getComponent(entityId, 'SelectableComponent');
            if (selectableComp && selectableComp.isSelected) {
                return entityId;
            }
        }
        return undefined;
    }
    updatePropertyInspector(entityId) {
        this.clearControls(); // Clear existing controls
        if (entityId === undefined) {
            this.pane.addFolder({ title: 'No Entity Selected' });
            return;
        }
        const entityFolder = this.pane.addFolder({ title: `Entity ${entityId} Properties` });
        // Get all components for the selected entity
        const components = this.world.componentManager.getAllComponentsForEntity(entityId);
        for (const componentName in components) {
            const component = components[componentName];
            this.registerComponentControls(componentName, component);
        }
    }
    onPlay() {
        console.log('Play button clicked');
        // Implement play logic
    }
    onPause() {
        console.log('Pause button clicked');
        // Implement pause logic
    }
    onReset() {
        console.log('Reset button clicked');
        // Implement reset logic
    }
    onAddBox() {
        console.log('Add Box button clicked');
        const entity = this.world.entityManager.createEntity();
        // Add PositionComponent
        const position = new components_1.PositionComponent(0, 5, 0);
        this.world.componentManager.addComponent(entity, 'PositionComponent', position);
        // Add RenderableComponent (for Three.js cube)
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        const mesh = new THREE.Mesh(geometry, material);
        const renderable = new components_1.RenderableComponent(mesh);
        this.world.componentManager.addComponent(entity, 'RenderableComponent', renderable);
        // Add RigidBodyComponent (for Rapier.js)
        const rigidBodyDesc = rapier3d_compat_1.default.RigidBodyDesc.dynamic().setTranslation(position.x, position.y, position.z);
        const rigidBody = this.renderSystem.physicsWorld.createRigidBody(rigidBodyDesc);
        const colliderDesc = rapier3d_compat_1.default.ColliderDesc.cuboid(0.5, 0.5, 0.5);
        this.renderSystem.physicsWorld.createCollider(colliderDesc, rigidBody);
        const rigidBodyComp = new components_2.RigidBodyComponent(rigidBody);
        this.world.componentManager.addComponent(entity, 'RigidBodyComponent', rigidBodyComp);
        // Add SelectableComponent
        this.world.componentManager.addComponent(entity, 'SelectableComponent', new components_1.SelectableComponent());
        this.renderSystem.addMesh(entity, mesh);
        this.updateSceneGraph();
    }
    onAddSphere() {
        console.log('Add Sphere button clicked');
        const entity = this.world.entityManager.createEntity();
        // Add PositionComponent
        const position = new components_1.PositionComponent(0, 5, 0);
        this.world.componentManager.addComponent(entity, 'PositionComponent', position);
        // Add RenderableComponent (for Three.js sphere)
        const geometry = new THREE.SphereGeometry(0.5, 32, 32);
        const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const mesh = new THREE.Mesh(geometry, material);
        const renderable = new components_1.RenderableComponent(mesh);
        this.world.componentManager.addComponent(entity, 'RenderableComponent', renderable);
        // Add RigidBodyComponent (for Rapier.js)
        const rigidBodyDesc = rapier3d_compat_1.default.RigidBodyDesc.dynamic().setTranslation(position.x, position.y, position.z);
        const rigidBody = this.renderSystem.physicsWorld.createRigidBody(rigidBodyDesc);
        const colliderDesc = rapier3d_compat_1.default.ColliderDesc.ball(0.5);
        this.renderSystem.physicsWorld.createCollider(colliderDesc, rigidBody);
        const rigidBodyComp = new components_2.RigidBodyComponent(rigidBody);
        this.world.componentManager.addComponent(entity, 'RigidBodyComponent', rigidBodyComp);
        // Add SelectableComponent
        this.world.componentManager.addComponent(entity, 'SelectableComponent', new components_1.SelectableComponent());
        this.renderSystem.addMesh(entity, mesh);
        this.updateSceneGraph();
    }
    onWindowResize() {
        const width = this.viewportContainer.clientWidth;
        const height = this.viewportContainer.clientHeight;
        this.renderSystem.camera.aspect = width / height;
        this.renderSystem.camera.updateProjectionMatrix();
        this.renderSystem.renderer.setSize(width, height);
    }
    onViewportClick(event) {
        // Deselect all entities first
        this.world.componentManager.getEntitiesWithComponents(['SelectableComponent']).forEach((entityId) => {
            const selectableComp = this.world.componentManager.getComponent(entityId, 'SelectableComponent');
            if (selectableComp) {
                selectableComp.isSelected = false;
            }
        });
        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / this.viewportContainer.clientWidth) * 2 - 1;
        mouse.y = -(event.clientY / this.viewportContainer.clientHeight) * 2 + 1;
        this.renderSystem.raycaster.setFromCamera(mouse, this.renderSystem.camera);
        const intersects = this.renderSystem.raycaster.intersectObjects(this.renderSystem.scene.children);
        if (intersects.length > 0) {
            const intersectedMesh = intersects[0].object;
            const entityId = this.renderSystem.getEntityIdFromMesh(intersectedMesh);
            if (entityId !== undefined) {
                const selectableComp = this.world.componentManager.getComponent(entityId, 'SelectableComponent');
                if (selectableComp) {
                    selectableComp.isSelected = true;
                    this.updatePropertyInspector(entityId);
                }
            }
        }
        else {
            this.updatePropertyInspector(undefined); // Clear property inspector if nothing is selected
        }
        this.updateSceneGraph(); // Update scene graph to reflect selection
    }
    updateSceneGraph() {
        this.sceneGraphContainer.innerHTML = '<h3>Scene Graph</h3>'; // Clear existing
        const ul = document.createElement('ul');
        ul.style.listStyleType = 'none';
        ul.style.paddingLeft = '0';
        this.world.componentManager.getEntitiesWithComponents(['PositionComponent']).forEach((entityId) => {
            const li = document.createElement('li');
            const selectableComp = this.world.componentManager.getComponent(entityId, 'SelectableComponent');
            li.textContent = `Entity ${entityId}`;
            if (selectableComp && selectableComp.isSelected) {
                li.style.fontWeight = 'bold';
                li.style.color = '#00ff00'; // Highlight selected
            }
            li.style.cursor = 'pointer';
            li.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent viewport click from deselecting
                this.selectEntity(entityId);
            });
            ul.appendChild(li);
        });
        this.sceneGraphContainer.appendChild(ul);
    }
    selectEntity(entityId) {
        // Deselect all entities first
        this.world.componentManager.getEntitiesWithComponents(['SelectableComponent']).forEach((entityIdToDeselect) => {
            const selectableComp = this.world.componentManager.getComponent(entityIdToDeselect, 'SelectableComponent');
            if (selectableComp) {
                selectableComp.isSelected = false;
            }
        });
        const selectableComp = this.world.componentManager.getComponent(entityId, 'SelectableComponent');
        if (selectableComp) {
            selectableComp.isSelected = true;
            this.updatePropertyInspector(entityId);
        }
        this.updateSceneGraph();
    }
}
exports.UIManager = UIManager;
