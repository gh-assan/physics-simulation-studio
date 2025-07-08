"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ecs_1 = require("@core/ecs");
const plugin_1 = require("@core/plugin");
const uiManager_1 = require("./uiManager");
const RenderSystem_1 = require("./systems/RenderSystem");
const components_1 = require("@core/components");
const components_2 = require("@plugins/rigid-body/components");
const rigid_body_1 = __importDefault(require("@plugins/rigid-body"));
// Initialize the ECS World
const world = new ecs_1.World();
// Register core components
world.componentManager.registerComponent(components_1.PositionComponent.name);
world.componentManager.registerComponent(components_1.RenderableComponent.name);
world.componentManager.registerComponent(components_1.RotationComponent.name);
world.componentManager.registerComponent(components_1.SelectableComponent.name);
world.componentManager.registerComponent(components_2.RigidBodyComponent.name);
// Initialize the Plugin Manager
const pluginManager = new plugin_1.PluginManager();
// Register RigidBodyPlugin
pluginManager.registerPlugin(new rigid_body_1.default());
pluginManager.activatePlugin("rigid-body-physics-rapier", world);
// Initialize Render System
const renderSystem = new RenderSystem_1.RenderSystem();
world.systemManager.registerSystem(renderSystem);
// Initialize the UI Manager
const uiManager = new uiManager_1.UIManager(world, renderSystem);
// Main application loop
const animate = () => {
    requestAnimationFrame(animate);
    // Update the world (ECS systems will run here)
    world.update(0); // deltaTime will be calculated in a real implementation
};
animate();
console.log("Studio Main Initialized");
