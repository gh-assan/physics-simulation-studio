"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const components_1 = require("../components");
describe('RigidBodyComponent', () => {
    it('should correctly store a Rapier RigidBody instance', () => {
        // Mock a Rapier RigidBody
        const mockRigidBody = {};
        const component = new components_1.RigidBodyComponent(mockRigidBody);
        expect(component.body).toBe(mockRigidBody);
    });
});
