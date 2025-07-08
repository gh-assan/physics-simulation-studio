import { World } from '@core/ecs';
import { PluginManager } from '@core/plugin';
import RigidBodyPlugin from '@plugins/rigid-body';
import { StudioUIManager } from './uiManager';
import { RenderSystem } from './systems/RenderSystem';
import { PropertyInspectorSystem } from './systems/PropertyInspectorSystem';
import { SceneSerializer } from './systems/SceneSerializer';
import { PositionComponent, RenderableComponent, SelectableComponent } from '@core/components';

const world = new World();
const uiManager = new StudioUIManager();
const pluginManager = new PluginManager(world, uiManager);
const sceneSerializer = new SceneSerializer();

async function initializeStudio() {
    // Register core plugins
    pluginManager.registerPlugin(new RigidBodyPlugin());

    // Activate plugins (e.g., rigid-body physics)
    await pluginManager.activatePlugin('rigid-body-physics-rapier');

    // Register studio systems
    const renderSystem = new RenderSystem();
    world.systemManager.registerSystem(renderSystem);

    const propertyInspectorSystem = new PropertyInspectorSystem(uiManager);
    world.systemManager.registerSystem(propertyInspectorSystem);

    // Create a dummy selectable entity for testing the PropertyInspectorSystem
    const dummyEntity = world.entityManager.createEntity();
    world.componentManager.registerComponent('PositionComponent');
    world.componentManager.registerComponent('RenderableComponent');
    world.componentManager.registerComponent('SelectableComponent');

    world.componentManager.addComponent(dummyEntity, 'PositionComponent', new PositionComponent(0, 0, 0));
    world.componentManager.addComponent(dummyEntity, 'RenderableComponent', new RenderableComponent('box', 0x00ff00, 1, 1, 1));
    world.componentManager.addComponent(dummyEntity, 'SelectableComponent', new SelectableComponent(true));

    // Add basic UI buttons for save/load/share
    const uiPanel = document.getElementById('ui-panel');
    if (uiPanel) {
        const saveButton = document.createElement('button');
        saveButton.textContent = 'Save Scene';
        saveButton.onclick = () => sceneSerializer.saveToFile(world);
        uiPanel.appendChild(saveButton);

        const loadButton = document.createElement('button');
        loadButton.textContent = 'Load Scene';
        loadButton.onclick = () => sceneSerializer.loadFromFile(world);
        uiPanel.appendChild(loadButton);

        const shareButton = document.createElement('button');
        shareButton.textContent = 'Share Scene (URL)';
        shareButton.onclick = () => sceneSerializer.shareViaUrl(world);
        uiPanel.appendChild(shareButton);
    }

    // Check for scene in URL on load
    sceneSerializer.loadFromUrl(window.location.href, world);

    // Main loop
    function animate() {
        requestAnimationFrame(animate);
        const deltaTime = 1 / 60; // Fixed timestep for now
        world.update(deltaTime);
    }
    animate();

    console.log("Physics Simulation Studio Initialized!");
}

initializeStudio();