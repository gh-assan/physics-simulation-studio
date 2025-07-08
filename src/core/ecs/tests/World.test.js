"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const World_1 = require("../World");
const System_1 = require("../System");
class PositionComponent {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}
class VelocityComponent {
    constructor(vx, vy) {
        this.vx = vx;
        this.vy = vy;
    }
}
class MovementSystem extends System_1.System {
    update(world, deltaTime) {
        const entities = world.componentManager.getEntitiesWithComponents([PositionComponent, VelocityComponent]);
        for (const entity of entities) {
            const position = world.componentManager.getComponent(entity, PositionComponent.name);
            const velocity = world.componentManager.getComponent(entity, VelocityComponent.name);
            position.x += velocity.vx * deltaTime;
            position.y += velocity.vy * deltaTime;
        }
    }
}
describe('World', () => {
    let world;
    beforeEach(() => {
        world = new World_1.World();
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
