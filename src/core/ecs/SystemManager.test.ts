import { System } from './System';
import { SystemManager } from './SystemManager';
import { World } from './World';

describe('SystemManager', () => {
  it('should update systems in priority order', () => {
    const world = new World();
    const systemManager = new SystemManager();
    const executionOrder: string[] = [];

    class MockSystem extends System {
      constructor(priority: number, private name: string) {
        super(priority);
      }

      update(world: World, deltaTime: number): void {
        executionOrder.push(this.name);
      }
    }

    const systemA = new MockSystem(200, 'A');
    const systemB = new MockSystem(10, 'B');
    const systemC = new MockSystem(100, 'C');

    systemManager.registerSystem(systemA, world);
    systemManager.registerSystem(systemB, world);
    systemManager.registerSystem(systemC, world);

    systemManager.updateAll(world, 0);

    expect(executionOrder).toEqual(['B', 'C', 'A']);
  });
});
