import { World } from '../World';
import { IComponent } from '../IComponent';
import { System } from '../System';

class PositionComponent implements IComponent {
    constructor(public x: number, public y: number) {}
}

class VelocityComponent implements IComponent {
    constructor(public vx: number, public vy: number) {}
}

class MovementSystem extends System {
    public update(world: World, deltaTime: number): void {
        const entities = world.componentManager.getEntitiesWithComponents([PositionComponent, VelocityComponent]);
        for (const entity of entities) {
            const position = world.componentManager.getComponent<PositionComponent>(entity, PositionComponent.name)!;
            const velocity = world.componentManager.getComponent<VelocityComponent>(entity, VelocityComponent.name)!;
            position.x += velocity.vx * deltaTime;
            position.y += velocity.vy * deltaTime;
        }
    }
}

describe('World', () => {
    let world: World;

    beforeEach(() => {
        world = new World();
        world.componentManager.registerComponent(PositionComponent.name, PositionComponent);
        world.componentManager.registerComponent(VelocityComponent.name, VelocityComponent);
        world.systemManager.registerSystem(new MovementSystem());
    });

    it('should update systems and modify components', () => {
        const entity = world.entityManager.createEntity();
        const position = new PositionComponent(0, 0);
        const velocity = new VelocityComponent(10, 5);

        world.componentManager.addComponent(entity, PositionComponent.name, position);
        world.componentManager.addComponent(entity, VelocityComponent.name, velocity);

        world.update(2);

        expect(position.x).toBe(20);
        expect(position.y).toBe(10);
    });
});