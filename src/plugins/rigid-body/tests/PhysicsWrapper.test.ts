import { PhysicsWrapper } from '../physics-wrapper';
import { World, Vector3, Quaternion } from '@dimforge/rapier3d-compat';

// Use jest.mocked to correctly type the imported modules as mock functions
const MockedWorld = jest.mocked(World);
const MockedVector3 = jest.mocked(Vector3);
const MockedQuaternion = jest.mocked(Quaternion);

describe('PhysicsWrapper', () => {
    let physicsWrapper: PhysicsWrapper;
    let mockRapierWorldInstance: any; // Use any for the mocked world instance

    beforeEach(() => {
        // Clear mocks before each test
        MockedWorld.mockClear();
        MockedVector3.mockClear();
        MockedQuaternion.mockClear();

        // Create a new instance of PhysicsWrapper, which will call the mocked RAPIER.World constructor
        physicsWrapper = new PhysicsWrapper();

        // Get the mock instance of World that was created by the PhysicsWrapper constructor
        mockRapierWorldInstance = MockedWorld.mock.results[0]?.value;
    });

    it('should initialize the Rapier world with gravity', () => {
        expect(MockedWorld).toHaveBeenCalledTimes(1);
        expect(MockedWorld).toHaveBeenCalledWith(expect.objectContaining({ x: 0.0, y: -9.81, z: 0.0 }));
        expect(physicsWrapper.world).toBe(mockRapierWorldInstance);
    });

    it('should call world.step() when step is called', () => {
        physicsWrapper.step(0.16);
        expect(mockRapierWorldInstance.step).toHaveBeenCalledTimes(1);
        expect(physicsWrapper.world.timestep).toBeCloseTo(1.0 / 60.0);
    });
});
