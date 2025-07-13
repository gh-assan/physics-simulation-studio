import { ISimulationPlugin } from "../../core/plugin";
import { World } from "../../core/ecs";
import { PhysicsSystem } from "./system";
import { RigidBodyComponent } from "./components";

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

    // 2. Register the system with the ECS
    const physicsSystem = new PhysicsSystem();
    world.systemManager.registerSystem(physicsSystem);
  }

  public unregister(): void {
    // Logic to unregister systems and components
    console.log("Unregistering RigidBodyPlugin...");
  }

  public initializeEntities(_world: World): void {
    // No initial entities for this plugin yet
  }
}

export default RigidBodyPlugin;
