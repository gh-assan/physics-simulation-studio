import { System } from './System';
import { World } from './World';

export class SystemManager {
    private systems: System[] = [];

    public registerSystem(system: System): void {
        this.systems.push(system);
    }

    public updateAll(world: World, deltaTime: number): void {
        for (const system of this.systems) {
            system.update(world, deltaTime);
        }
    }
}
