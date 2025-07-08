import { World } from '@core/ecs';
import { PluginManager } from '@core/plugin';
import { UIManager } from './uiManager';
import { RenderSystem } from './systems/RenderSystem';
import { PositionComponent, RenderableComponent, RotationComponent, SelectableComponent } from '@core/components';
import { RigidBodyComponent } from '@plugins/rigid-body/components';
import RigidBodyPlugin from '@plugins/rigid-body';

// Initialize the ECS World
const world = new World();

// Register core components
world.componentManager.registerComponent(PositionComponent.name);
world.componentManager.registerComponent(RenderableComponent.name);
world.componentManager.registerComponent(RotationComponent.name);
world.componentManager.registerComponent(SelectableComponent.name);
world.componentManager.registerComponent(RigidBodyComponent.name);

// Initialize the Plugin Manager
const pluginManager = new PluginManager();

// Register RigidBodyPlugin
pluginManager.registerPlugin(new RigidBodyPlugin());
pluginManager.activatePlugin("rigid-body-physics-rapier", world);

// Initialize Render System
const renderSystem = new RenderSystem();
world.systemManager.registerSystem(renderSystem);

// Initialize the UI Manager
const uiManager = new UIManager(world, renderSystem);

// Main application loop
const animate = () => {
    requestAnimationFrame(animate);
    // Update the world (ECS systems will run here)
    world.update(0); // deltaTime will be calculated in a real implementation
};

animate();

console.log("Studio Main Initialized");
