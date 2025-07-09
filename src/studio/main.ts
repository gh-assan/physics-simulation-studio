import { Studio } from "./Studio";
import { World } from "../core/ecs/World";
import { PluginManager } from "../core/plugin/PluginManager";
import { RenderSystem } from "./systems/RenderSystem";
import { PropertyInspectorSystem } from "./systems/PropertyInspectorSystem";
import { UIManager } from "./uiManager";
import { SceneSerializer } from "./systems/SceneSerializer";
import { FlagSimulationPlugin } from "@plugins/flag-simulation";
import { WaterSimulationPlugin } from "@plugins/water-simulation";
import { FlagComponent, FlagSystem } from "../plugins/flag-simulation";
import { PositionComponent } from "../core/components/PositionComponent";
import { RenderableComponent } from "../core/components/RenderableComponent";
import { SelectableComponent } from "../core/components/SelectableComponent";
import { RotationComponent } from "../core/components/RotationComponent";
import { Pane } from 'tweakpane';

const world = new World();
const pluginManager = new PluginManager(world);

// Setup Tweakpane for global controls
const pane = new Pane();
const uiManager = new UIManager(pane);
const sceneSerializer = new SceneSerializer();

// Initialize Studio first
const studio = new Studio(world, pluginManager);

// Register core components
world.componentManager.registerComponent(PositionComponent.name, PositionComponent);
world.componentManager.registerComponent(RenderableComponent.name, RenderableComponent);
world.componentManager.registerComponent(SelectableComponent.name, SelectableComponent);
world.componentManager.registerComponent(RotationComponent.name, RotationComponent);

// Register systems
const renderSystem = new RenderSystem(studio);
world.systemManager.registerSystem(renderSystem);
world.systemManager.registerSystem(new PropertyInspectorSystem(uiManager));

// Set renderSystem on studio
studio.setRenderSystem(renderSystem);

// Register plugins
pluginManager.registerPlugin(new FlagSimulationPlugin());
pluginManager.registerPlugin(new WaterSimulationPlugin());

// Expose for debugging/console interaction
(window as any).world = world;
(window as any).pluginManager = pluginManager;
(window as any).uiManager = uiManager;
(window as any).sceneSerializer = sceneSerializer;
(window as any).studio = studio;

const globalControlsFolder = (pane as any).addFolder({ title: 'Global Controls' });
globalControlsFolder.addButton({ title: 'Play' }).on('click', () => studio.play());
globalControlsFolder.addButton({ title: 'Pause' }).on('click', () => studio.pause());
globalControlsFolder.addButton({ title: 'Reset' }).on('click', () => studio.reset());

const simulationSelectionFolder = (pane as any).addFolder({ title: 'Simulations' });
const simulationParams = {
    selectedSimulation: 'flag-simulation', // Default selected simulation
};

simulationSelectionFolder.addBinding(simulationParams, 'selectedSimulation', {
    label: '',
    options: studio.getAvailableSimulationNames().map(name => ({ text: name, value: name })),
}).on('change', (ev: { value: string }) => {
    studio.loadSimulation(ev.value);
});

// Initial load of the default simulation
await studio.loadSimulation(simulationParams.selectedSimulation);

let lastTime = 0;
// Main application loop
function animate(currentTime: number) {
    requestAnimationFrame(animate);

    const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
    lastTime = currentTime;

    // Update the studio (which updates the world if playing)
    studio.update(deltaTime);
}

animate(0);

console.log("Physics Simulation Studio Initialized");

