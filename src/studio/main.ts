import { World } from "../core/ecs/World";
import { PluginManager } from "../core/plugin/PluginManager";
import { RenderSystem } from "./systems/RenderSystem";
import { PropertyInspectorSystem } from "./systems/PropertyInspectorSystem";
import { UIManager } from "./uiManager";
import { SceneSerializer } from "./systems/SceneSerializer";
import { FlagSimulationPlugin } from "../plugins/flag-simulation";
import { FlagComponent, FlagSystem } from "../plugins/flag-simulation";
import { PositionComponent } from "../core/components/PositionComponent";
import { RenderableComponent } from "../core/components/RenderableComponent";
import { SelectableComponent } from "../core/components/SelectableComponent";
import { Pane } from 'tweakpane';

const world = new World();
const pluginManager = new PluginManager(world);
const uiManager = new UIManager();
const sceneSerializer = new SceneSerializer();

world.componentManager.registerComponent(PositionComponent.name, PositionComponent);
world.componentManager.registerComponent(RenderableComponent.name, RenderableComponent);
world.componentManager.registerComponent(SelectableComponent.name, SelectableComponent);
pluginManager.registerPlugin(new FlagSimulationPlugin());
await pluginManager.activatePlugin('flag-simulation');

// Example: Create a flag entity
const flagEntity = world.entityManager.createEntity();
world.componentManager.addComponent(flagEntity, PositionComponent.name, new PositionComponent(0, 0, -10));
world.componentManager.addComponent(flagEntity, RenderableComponent.name, new RenderableComponent('plane', "#00ff00")); // Green flag
world.componentManager.addComponent(flagEntity, FlagComponent.name, new FlagComponent(20, 12, 20, 12));
world.componentManager.addComponent(flagEntity, SelectableComponent.name, new SelectableComponent());
const renderSystem = new RenderSystem();
world.systemManager.registerSystem(renderSystem);

const propertyInspectorSystem = new PropertyInspectorSystem(uiManager);
world.systemManager.registerSystem(propertyInspectorSystem);

// Tweakpane for controls
const pane = new Pane();

// Get the FlagSystem instance
const flagSystem = world.systemManager.getSystem(FlagSystem) as FlagSystem;

if (flagSystem) {
    const gravityFolder = pane.addFolder({ title: 'Gravity' });
    gravityFolder.addBinding(flagSystem.gravity, 'y', { min: -20, max: 0, step: 0.1 });

    const windFolder = pane.addFolder({ title: 'Wind' });
    windFolder.addBinding(flagSystem.wind, 'x', { min: -10, max: 10, step: 0.1 });
    windFolder.addBinding(flagSystem.wind, 'y', { min: -10, max: 10, step: 0.1 });
    windFolder.addBinding(flagSystem.wind, 'z', { min: -10, max: 10, step: 0.1 });
}

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
