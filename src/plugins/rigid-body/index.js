"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const system_1 = require("./system");
const components_1 = require("./components");
class RigidBodyPlugin {
    getName() {
        return "rigid-body-physics-rapier";
    }
    getDependencies() {
        return [];
    }
    register(world) {
        console.log("Registering RigidBodyPlugin...");
        // 1. Register components with the ECS
        world.componentManager.registerComponent(components_1.RigidBodyComponent.name, components_1.RigidBodyComponent);
        // 2. Register the system with the ECS
        const physicsSystem = new system_1.PhysicsSystem();
        world.systemManager.registerSystem(physicsSystem);
    }
    unregister() {
        // Logic to unregister systems and components
        console.log("Unregistering RigidBodyPlugin...");
    }
}
exports.default = RigidBodyPlugin;
