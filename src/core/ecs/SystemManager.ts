import {System} from './System';
import {World} from './World';
import {EventEmitter} from '../events/EventEmitter';

export class SystemManager {
  private systems: System[] = [];
  private eventEmitter: EventEmitter = new EventEmitter();

  public registerSystem(system: System): void {
    this.systems.push(system);
    this.eventEmitter.emit('systemRegistered', system);
  }

  public onSystemRegistered(callback: (system: System) => void): void {
    this.eventEmitter.on('systemRegistered', callback);
  }

  public updateAll(world: World, deltaTime: number): void {
    for (const system of this.systems) {
      system.update(world, deltaTime);
    }
  }

  public getSystem<T extends System>(
    systemType: new (...args: any[]) => T,
  ): T | undefined {
    return this.systems.find(system => system instanceof systemType) as T;
  }

  public clear(): void {
    this.systems = [];
  }
}
