import { World } from '@core/ecs';
import { PluginManager } from '@core/plugin';
import { StudioUIManager } from './uiManager';
import { RenderSystem } from './systems/RenderSystem';
import { PropertyInspectorSystem } from './systems/PropertyInspectorSystem';
import { SceneSerializer } from './systems/SceneSerializer';

// Initialize the ECS World
const world = new World();

// Initialize the Plugin Manager
const pluginManager = new PluginManager();

// Initialize the UI Manager
const uiManager = new StudioUIManager();

// Initialize Render System
const viewportContainer = document.getElementById('viewport-container');
if (!viewportContainer) {
    throw new Error("Viewport container not found!");
}
const renderSystem = new RenderSystem(viewportContainer);
world.systemManager.registerSystem(renderSystem);

// Initialize Property Inspector System
const propertyInspectorSystem = new PropertyInspectorSystem(uiManager);
world.systemManager.registerSystem(propertyInspectorSystem);

// Initialize Scene Serializer
const sceneSerializer = new SceneSerializer();
sceneSerializer.loadFromUrl(world);

// Main application loop
const animate = () => {
    requestAnimationFrame(animate);
    // Update the world (ECS systems will run here)
    world.update(0); // deltaTime will be calculated in a real implementation
};

animate();

console.log("Studio Main Initialized");
