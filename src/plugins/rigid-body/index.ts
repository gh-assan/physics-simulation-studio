import { ISimulationPlugin, UIManager } from '../../core/plugin';
import { World } from '../../core/ecs';
import { PhysicsWrapper } from './physics-wrapper';
import { PhysicsSystem } from './system';
import { RigidBodyComponent } from './components';

class RigidBodyPlugin implements ISimulationPlugin {
    public getName(): string {
        return "rigid-body-physics-rapier";
    }

    public getDependencies(): string[] {
        return [];
    }

    public register(world: World, uiManager: UIManager): void {
        console.log("Registering RigidBodyPlugin...");

        // 1. Initialize the physics engine wrapper
        const physicsWrapper = new PhysicsWrapper();

        // 2. Register components with the ECS
        world.componentManager.registerComponent('RigidBodyComponent');

        // 3. Register the system with the ECS
        const physicsSystem = new PhysicsSystem(physicsWrapper);
        world.systemManager.registerSystem(physicsSystem);

        // 4. Register UI controls (details in Section 4)
        // uiManager.registerComponentControls('RigidBodyComponent',...);
    }

    public unregister(): void {
        // Logic to unregister systems and components
        console.log("Unregistering RigidBodyPlugin...");
    }
}

export default RigidBodyPlugin;
