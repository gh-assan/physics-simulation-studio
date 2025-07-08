"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const system_1 = require("../system");
const ecs_1 = require("@core/ecs");
const components_1 = require("@core/components");
const components_2 = require("../components");
const rapier3d_compat_1 = __importDefault(require("@dimforge/rapier3d-compat"));
describe('PhysicsSystem', () => {
    let world;
    let physicsSystem;
    beforeEach(() => {
        world = new ecs_1.World();
        physicsSystem = new system_1.PhysicsSystem();
        world.componentManager.registerComponent(components_1.PositionComponent.name, components_1.PositionComponent);
        world.componentManager.registerComponent(components_1.RotationComponent.name, components_1.RotationComponent);
        world.componentManager.registerComponent(components_2.RigidBodyComponent.name, components_2.RigidBodyComponent);
    });
    it('should synchronize rigid body translation and rotation to ECS components', () => {
        const entity = world.entityManager.createEntity();
        const mockTranslation = new rapier3d_compat_1.default.Vector3(10, 20, 30);
        const mockRotation = new rapier3d_compat_1.default.Quaternion(0.1, 0.2, 0.3, 0.4);
        const mockRigidBody = {
            translation: () => mockTranslation,
            rotation: () => mockRotation,
        };
        const rigidBodyComp = new components_2.RigidBodyComponent(mockRigidBody);
        const posComp = new components_1.PositionComponent(0, 0, 0);
        const rotComp = new components_1.RotationComponent(0, 0, 0, 0);
        world.componentManager.addComponent(entity, components_2.RigidBodyComponent.name, rigidBodyComp);
        world.componentManager.addComponent(entity, components_1.PositionComponent.name, posComp);
        world.componentManager.addComponent(entity, components_1.RotationComponent.name, rotComp);
        physicsSystem.update(world, 0.16);
        expect(posComp.x).toBe(mockTranslation.x);
        expect(posComp.y).toBe(mockTranslation.y);
        expect(posComp.z).toBe(mockTranslation.z);
        expect(rotComp.x).toBe(mockRotation.x);
        expect(rotComp.y).toBe(mockRotation.y);
        expect(rotComp.z).toBe(mockRotation.z);
        expect(rotComp.w).toBe(mockRotation.w);
    });
});
