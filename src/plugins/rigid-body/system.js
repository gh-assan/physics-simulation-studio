"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhysicsSystem = void 0;
const ecs_1 = require("../../core/ecs");
const components_1 = require("./components");
const components_2 = require("../../core/components");
class PhysicsSystem extends ecs_1.System {
    constructor() {
        super();
        this.componentQuery = [components_1.RigidBodyComponent, components_2.PositionComponent, components_2.RotationComponent];
    }
    update(world, deltaTime) {
        // Physics world step is handled by RenderSystem
        // Synchronize physics state back to ECS components
        const entities = world.componentManager.getEntitiesWithComponents(this.componentQuery);
        for (const entityID of entities) {
            const rigidBodyComp = world.componentManager.getComponent(entityID, components_1.RigidBodyComponent.name);
            const posComp = world.componentManager.getComponent(entityID, components_2.PositionComponent.name);
            const rotComp = world.componentManager.getComponent(entityID, components_2.RotationComponent.name);
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
