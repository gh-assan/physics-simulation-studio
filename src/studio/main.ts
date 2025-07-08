import { Studio } from "./Studio";
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

// Register core components
world.componentManager.registerComponent(PositionComponent.name, PositionComponent);
world.componentManager.registerComponent(RenderableComponent.name, RenderableComponent);
world.componentManager.registerComponent(SelectableComponent.name, SelectableComponent);

// Register systems
const renderSystem = new RenderSystem();
world.systemManager.registerSystem(renderSystem);
world.systemManager.registerSystem(new PropertyInspectorSystem(uiManager));

// Register plugins
pluginManager.registerPlugin(new FlagSimulationPlugin());

// Initialize Studio
const studio = new Studio(world, pluginManager, renderSystem);

// Expose for debugging/console interaction
(window as any).world = world;
(window as any).pluginManager = pluginManager;
(window as any).uiManager = uiManager;
(window as any).sceneSerializer = sceneSerializer;
(window as any).studio = studio;

// Setup Tweakpane for global controls
const pane = new Pane();

const globalControlsFolder = pane.addFolder({ title: 'Global Controls' });
globalControlsFolder.addButton({ title: 'Play' }).on('click', () => studio.play());
globalControlsFolder.addButton({ title: 'Pause' }).on('click', () => studio.pause());
globalControlsFolder.addButton({ title: 'Reset' }).on('click', () => studio.reset());

const simulationSelectionFolder = pane.addFolder({ title: 'Simulations' });
const simulationParams = {
    selectedSimulation: 'flag-simulation', // Default selected simulation
};

simulationSelectionFolder.addBinding(simulationParams, 'selectedSimulation', {
    options: studio.getAvailableSimulationNames().map(name => ({ text: name, value: name })),
}).on('change', (ev) => {
    studio.loadSimulation(ev.value);
});

// Add FlagSystem controls dynamically when FlagSimulation is active
studio.world.systemManager.onSystemRegistered((system) => {
    if (system instanceof FlagSystem) {
        const flagSystem = system as FlagSystem;
        const gravityFolder = pane.addFolder({ title: 'Gravity' });
        gravityFolder.addBinding(flagSystem.gravity, 'y', { min: -20, max: 0, step: 0.1 });

        const windFolder = pane.addFolder({ title: 'Wind' });
        windFolder.addBinding(flagSystem.wind, 'x', { min: -10, max: 10, step: 0.1 });
        windFolder.addBinding(flagSystem.wind, 'y', { min: -10, max: 10, step: 0.1 });
        windFolder.addBinding(flagSystem.wind, 'z', { min: -10, max: 10, step: 0.1 });
    }
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

