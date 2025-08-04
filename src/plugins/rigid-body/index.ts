import { ISimulationPlugin } from "../../core/plugin";
import { World } from "../../core/ecs";
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

  public register(world: World): void {
    console.log("Registering RigidBodyPlugin...");

    // 1. Register components with the ECS
    world.componentManager.registerComponent(RigidBodyComponent);
    
    // 2. Register systems with the ECS
    world.systemManager.registerSystem(new PhysicsSystem());
    
    // Example: create and add a RigidBodyComponent to an entity
    const entityId = world.entityManager.createEntity();
    const rigidBody = new RigidBody();
    const rigidBodyComponent = new RigidBodyComponent(rigidBody);
    world.componentManager.addComponent(entityId, RigidBodyComponent.type, rigidBodyComponent);
  }

  public unregister(): void {
    // Logic to unregister systems and components
    console.log("Unregistering RigidBodyPlugin...");
  }

  public initializeEntities(_world: World): void {
    // No initial entities for this plugin yet
  }

  public getSystems(studio: IStudio): System[] {
    return [new PhysicsSystem()];
  }
}

export default RigidBodyPlugin;
