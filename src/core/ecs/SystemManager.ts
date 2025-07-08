import { System } from './System';
import { World } from './World';

export class SystemManager {
    private systems: System[] = [];

    public registerSystem(system: System): void {
        this.systems.push(system);
    }

    public getSystem<T extends System>(systemType: new (...args: any[]) => T): T | undefined {
        return this.systems.find(system => system instanceof systemType) as T;
    }

    public updateAll(world: World, deltaTime: number): void {
        for (const system of this.systems) {
            system.update(world, deltaTime);
        }
    }
}
