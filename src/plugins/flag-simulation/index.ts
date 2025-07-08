import { World } from '../../core/ecs/World';
import { ISimulationPlugin } from '../../core/plugin/ISimulationPlugin';
import { FlagComponent } from './FlagComponent';
import { FlagSystem } from './FlagSystem';

export { FlagComponent } from './FlagComponent';
export { FlagSystem } from './FlagSystem';

export class FlagSimulationPlugin implements ISimulationPlugin {
    getName(): string {
        return 'flag-simulation';
    }
    getDependencies(): string[] {
        return [];
    }
    register(world: World): void {
        world.componentManager.registerComponent(FlagComponent.name, FlagComponent);
        world.systemManager.registerSystem(new FlagSystem());
        console.log('FlagSimulationPlugin registered.');
    }
    unregister(): void {
        // Optionally implement cleanup logic
    }
}