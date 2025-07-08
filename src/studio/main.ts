import { World } from "../core/ecs/World";
import { PluginManager } from "../core/plugin/PluginManager";
import { RenderSystem } from "./systems/RenderSystem";
import { PropertyInspectorSystem } from "./systems/PropertyInspectorSystem";
import { UIManager } from "./uiManager";
import { SceneSerializer } from "./systems/SceneSerializer";

const world = new World();
const pluginManager = new PluginManager(world);
const uiManager = new UIManager();
const sceneSerializer = new SceneSerializer();

// Register core studio systems
const renderSystem = new RenderSystem();
world.systemManager.registerSystem(renderSystem);

const propertyInspectorSystem = new PropertyInspectorSystem(uiManager);
world.systemManager.registerSystem(propertyInspectorSystem);

// Expose for debugging/console interaction
(window as any).world = world;
(window as any).pluginManager = pluginManager;
(window as any).uiManager = uiManager;
(window as any).sceneSerializer = sceneSerializer;

let lastTime = 0;
// Main application loop
function animate(currentTime: number) {
    requestAnimationFrame(animate);

    const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
    lastTime = currentTime;

    // Update the world
    world.update(deltaTime);
}

animate(0);

console.log("Physics Simulation Studio Initialized");
