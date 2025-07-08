import { Pane } from 'tweakpane';
import * as THREE from 'three';
import { World } from '@core/ecs';
import { RenderSystem } from '@studio/systems/RenderSystem';
import { PositionComponent, RenderableComponent, RotationComponent, SelectableComponent } from '@core/components';
import { RigidBodyComponent } from '@plugins/rigid-body/components';
import RAPIER from '@dimforge/rapier3d-compat';

export class UIManager {
    private appContainer: HTMLElement;
    private viewportContainer: HTMLElement;
    private tweakpaneContainer: HTMLElement;
    private sceneGraphContainer: HTMLElement;
    private playButton: HTMLButtonElement;
    private pauseButton: HTMLButtonElement;
    private resetButton: HTMLButtonElement;
    private addBoxButton: HTMLButtonElement;
    private addSphereButton: HTMLButtonElement;

    private pane: Pane;
    private world: World;
    private renderSystem: RenderSystem;

    constructor(world: World, renderSystem: RenderSystem) {
        this.world = world;
        this.renderSystem = renderSystem;

        this.appContainer = document.getElementById('app-container')!;
        this.viewportContainer = document.getElementById('viewport-container')!;
        this.tweakpaneContainer = document.getElementById('tweakpane-container')!;
        this.sceneGraphContainer = document.getElementById('scene-graph-container')!;

        this.playButton = document.getElementById('play-button') as HTMLButtonElement;
        this.pauseButton = document.getElementById('pause-button') as HTMLButtonElement;
        this.resetButton = document.getElementById('reset-button') as HTMLButtonElement;
        this.addBoxButton = document.getElementById('add-box-button') as HTMLButtonElement;
        this.addSphereButton = document.getElementById('add-sphere-button') as HTMLButtonElement;

        this.pane = new Pane({
            container: this.tweakpaneContainer,
        });

        this.setupEventListeners();
        this.setupViewport();
        this.setupTweakpane();
    }

    private setupEventListeners(): void {
        this.playButton.addEventListener('click', () => this.onPlay());
        this.pauseButton.addEventListener('click', () => this.onPause());
        this.resetButton.addEventListener('click', () => this.onReset());
        this.addBoxButton.addEventListener('click', () => this.onAddBox());
        this.addSphereButton.addEventListener('click', () => this.onAddSphere());

        window.addEventListener('resize', () => this.onWindowResize());
        this.viewportContainer.addEventListener('click', (event) => this.onViewportClick(event));
    }

    private setupViewport(): void {
        this.viewportContainer.appendChild(this.renderSystem.renderer.domElement);
        this.onWindowResize(); // Initial size setup
    }

    private setupTweakpane(): void {
        // Initial Tweakpane setup, will be populated dynamically
    }

    public clearControls(): void {
        if (this.pane) {
            this.pane.dispose();
        }
        this.pane = new Pane({
            container: this.tweakpaneContainer,
        });
    }

    public registerComponentControls(componentName: string, component: any): void {
        const componentFolder = (this.pane as any).addFolder({ title: componentName });

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
                    this.world.componentManager.updateComponent(this.getSelectedEntityId()!, componentName, component);
                });
            } else if (typeof value === 'boolean') {
                componentFolder.addBinding(component, key, {
                    label: key,
                }).on('change', () => {
                    this.world.componentManager.updateComponent(this.getSelectedEntityId()!, componentName, component);
                });
            } else if (typeof value === 'string') {
                componentFolder.addBinding(component, key, {
                    label: key,
                }).on('change', () => {
                    this.world.componentManager.updateComponent(this.getSelectedEntityId()!, componentName, component);
                });
            }
        }
    }

    private getSelectedEntityId(): number | undefined {
        const selectableEntities = this.world.componentManager.getEntitiesWithComponents(['SelectableComponent']);
        for (const entityId of selectableEntities) {
            const selectableComp = this.world.componentManager.getComponent<SelectableComponent>(entityId, 'SelectableComponent');
            if (selectableComp && selectableComp.isSelected) {
                return entityId;
            }
        }
        return undefined;
    }

    public updatePropertyInspector(entityId?: number): void {
        this.clearControls(); // Clear existing controls

        if (entityId === undefined) {
            (this.pane as any).addFolder({ title: 'No Entity Selected' });
            return;
        }

        const entityFolder = (this.pane as any).addFolder({ title: `Entity ${entityId} Properties` });

        // Get all components for the selected entity
        const components = this.world.componentManager.getAllComponentsForEntity(entityId);

        for (const componentName in components) {
            const component = components[componentName];
            this.registerComponentControls(componentName, component);
        }
    }

    private onPlay(): void {
        console.log('Play button clicked');
        // Implement play logic
    }

    private onPause(): void {
        console.log('Pause button clicked');
        // Implement pause logic
    }

    private onReset(): void {
        console.log('Reset button clicked');
        // Implement reset logic
    }

    private onAddBox(): void {
        console.log('Add Box button clicked');
        const entity = this.world.entityManager.createEntity();

        // Add PositionComponent
        const position = new PositionComponent(0, 5, 0);
        this.world.componentManager.addComponent(entity, 'PositionComponent', position);

        // Add RenderableComponent (for Three.js cube)
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        const mesh = new THREE.Mesh(geometry, material);
        const renderable = new RenderableComponent(mesh);
        this.world.componentManager.addComponent(entity, 'RenderableComponent', renderable);

        // Add RigidBodyComponent (for Rapier.js)
        const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(position.x, position.y, position.z);
        const rigidBody = this.renderSystem.physicsWorld.createRigidBody(rigidBodyDesc);
        const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
        this.renderSystem.physicsWorld.createCollider(colliderDesc, rigidBody);
        const rigidBodyComp = new RigidBodyComponent(rigidBody);
        this.world.componentManager.addComponent(entity, 'RigidBodyComponent', rigidBodyComp);

        // Add SelectableComponent
        this.world.componentManager.addComponent(entity, 'SelectableComponent', new SelectableComponent());

        this.renderSystem.addMesh(entity, mesh);
        this.updateSceneGraph();
    }

    private onAddSphere(): void {
        console.log('Add Sphere button clicked');
        const entity = this.world.entityManager.createEntity();

        // Add PositionComponent
        const position = new PositionComponent(0, 5, 0);
        this.world.componentManager.addComponent(entity, 'PositionComponent', position);

        // Add RenderableComponent (for Three.js sphere)
        const geometry = new THREE.SphereGeometry(0.5, 32, 32);
        const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const mesh = new THREE.Mesh(geometry, material);
        const renderable = new RenderableComponent(mesh);
        this.world.componentManager.addComponent(entity, 'RenderableComponent', renderable);

        // Add RigidBodyComponent (for Rapier.js)
        const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(position.x, position.y, position.z);
        const rigidBody = this.renderSystem.physicsWorld.createRigidBody(rigidBodyDesc);
        const colliderDesc = RAPIER.ColliderDesc.ball(0.5);
        this.renderSystem.physicsWorld.createCollider(colliderDesc, rigidBody);
        const rigidBodyComp = new RigidBodyComponent(rigidBody);
        this.world.componentManager.addComponent(entity, 'RigidBodyComponent', rigidBodyComp);

        // Add SelectableComponent
        this.world.componentManager.addComponent(entity, 'SelectableComponent', new SelectableComponent());

        this.renderSystem.addMesh(entity, mesh);
        this.updateSceneGraph();
    }

    private onWindowResize(): void {
        const width = this.viewportContainer.clientWidth;
        const height = this.viewportContainer.clientHeight;
        this.renderSystem.camera.aspect = width / height;
        this.renderSystem.camera.updateProjectionMatrix();
        this.renderSystem.renderer.setSize(width, height);
    }

    private onViewportClick(event: MouseEvent): void {
        // Deselect all entities first
        this.world.componentManager.getEntitiesWithComponents(['SelectableComponent']).forEach((entityId: number) => {
            const selectableComp = this.world.componentManager.getComponent<SelectableComponent>(entityId, 'SelectableComponent');
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
                const selectableComp = this.world.componentManager.getComponent<SelectableComponent>(entityId, 'SelectableComponent');
                if (selectableComp) {
                    selectableComp.isSelected = true;
                    this.updatePropertyInspector(entityId);
                }
            }
        } else {
            this.updatePropertyInspector(undefined); // Clear property inspector if nothing is selected
        }
        this.updateSceneGraph(); // Update scene graph to reflect selection
    }

    public updateSceneGraph(): void {
        this.sceneGraphContainer.innerHTML = '<h3>Scene Graph</h3>'; // Clear existing
        const ul = document.createElement('ul');
        ul.style.listStyleType = 'none';
        ul.style.paddingLeft = '0';

        this.world.componentManager.getEntitiesWithComponents(['PositionComponent']).forEach((entityId: number) => {
            const li = document.createElement('li');
            const selectableComp = this.world.componentManager.getComponent<SelectableComponent>(entityId, 'SelectableComponent');
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

    private selectEntity(entityId: number): void {
        // Deselect all entities first
        this.world.componentManager.getEntitiesWithComponents(['SelectableComponent']).forEach((entityIdToDeselect: number) => {
            const selectableComp = this.world.componentManager.getComponent<SelectableComponent>(entityIdToDeselect, 'SelectableComponent');
            if (selectableComp) {
                selectableComp.isSelected = false;
            }
        });

        const selectableComp = this.world.componentManager.getComponent<SelectableComponent>(entityId, 'SelectableComponent');
        if (selectableComp) {
            selectableComp.isSelected = true;
            this.updatePropertyInspector(entityId);
        }
        this.updateSceneGraph();
    }
}
