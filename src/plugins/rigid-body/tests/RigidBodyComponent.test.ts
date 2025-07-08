import { RigidBodyComponent } from '../components';
import RAPIER from '@dimforge/rapier3d-compat';

describe('RigidBodyComponent', () => {
    it('should correctly store a Rapier RigidBody instance', () => {
        // Mock a Rapier RigidBody
        const mockRigidBody = {} as RAPIER.RigidBody;
        const component = new RigidBodyComponent(mockRigidBody);
        expect(component.body).toBe(mockRigidBody);
    });
});
