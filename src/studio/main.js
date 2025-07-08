"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const World_1 = require("../core/ecs/World");
const PluginManager_1 = require("../core/plugin/PluginManager");
const RenderSystem_1 = require("./systems/RenderSystem");
const PropertyInspectorSystem_1 = require("./systems/PropertyInspectorSystem");
const uiManager_1 = require("./uiManager");
const SceneSerializer_1 = require("./systems/SceneSerializer");
const world = new World_1.World();
const pluginManager = new PluginManager_1.PluginManager(world);
const uiManager = new uiManager_1.UIManager();
const sceneSerializer = new SceneSerializer_1.SceneSerializer();
// Register core studio systems
const renderSystem = new RenderSystem_1.RenderSystem();
world.systemManager.registerSystem(renderSystem);
const propertyInspectorSystem = new PropertyInspectorSystem_1.PropertyInspectorSystem(uiManager);
world.systemManager.registerSystem(propertyInspectorSystem);
// Expose for debugging/console interaction
window.world = world;
window.pluginManager = pluginManager;
window.uiManager = uiManager;
window.sceneSerializer = sceneSerializer;
let lastTime = 0;
// Main application loop
function animate(currentTime) {
    requestAnimationFrame(animate);
    const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
    lastTime = currentTime;
    // Update the world
    world.update(deltaTime);
}
animate(0);
console.log("Physics Simulation Studio Initialized");
