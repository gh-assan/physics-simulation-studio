import { ISimulationPlugin } from "@core/plugin/ISimulationPlugin";
import { IWorld } from "@core/ecs/IWorld";
import { PhysicsSystem } from "./system";
import { RigidBodyComponent } from "./components";
import { RigidBody } from "../../core/physics/RigidBody";
import { System } from "../../core/ecs/System";
import { IStudio } from "../../studio/IStudio";

class RigidBodyPlugin implements ISimulationPlugin {
  public getName(): string {
    return "rigid-body-physics-rapier";
  }

  public getDependencies(): string[] {
    return [];
  }

  public register(world: IWorld): void {
    console.log("Registering RigidBodyPlugin...");

    // Register components with the ECS using IWorld interface
    world.registerComponent(RigidBodyComponent);
  }

  public unregister(): void {
    // Logic to unregister systems and components
    console.log("Unregistering RigidBodyPlugin...");
  }

  public initializeEntities(world: IWorld): void {
    // Example: create and add a RigidBodyComponent to an entity
    const entityId = world.createEntity();
    const rigidBody = new RigidBody();
    const rigidBodyComponent = new RigidBodyComponent(rigidBody);
    world.addComponent(entityId, RigidBodyComponent.type, rigidBodyComponent);
  }

  public getSystems(studio: IStudio): System[] {
    return [new PhysicsSystem()];
  }
}

// Export plugin instance for auto-discovery
export default new RigidBodyPlugin();
