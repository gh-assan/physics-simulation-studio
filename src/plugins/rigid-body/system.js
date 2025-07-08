"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhysicsSystem = void 0;
const ecs_1 = require("../../core/ecs");
class PhysicsSystem extends ecs_1.System {
    constructor() {
        super();
        this.componentQuery = ['RigidBodyComponent', 'PositionComponent', 'RotationComponent'];
    }
    update(world, deltaTime) {
        // Physics world step is handled by RenderSystem
        // Synchronize physics state back to ECS components
        const entities = world.componentManager.getEntitiesWithComponents(this.componentQuery);
        for (const entityID of entities) {
            const rigidBodyComp = world.componentManager.getComponent(entityID, 'RigidBodyComponent');
            const posComp = world.componentManager.getComponent(entityID, 'PositionComponent');
            const rotComp = world.componentManager.getComponent(entityID, 'RotationComponent');
            const translation = rigidBodyComp.body.translation();
            const rotation = rigidBodyComp.body.rotation();
            posComp.x = translation.x;
            posComp.y = translation.y;
            posComp.z = translation.z;
            rotComp.x = rotation.x;
            rotComp.y = rotation.y;
            rotComp.z = rotation.z;
            rotComp.w = rotation.w;
        }
    }
}
exports.PhysicsSystem = PhysicsSystem;
