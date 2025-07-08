"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const physics_wrapper_1 = require("../physics-wrapper");
const rapier3d_compat_1 = require("@dimforge/rapier3d-compat");
// Use jest.mocked to correctly type the imported modules as mock functions
const MockedWorld = jest.mocked(rapier3d_compat_1.World);
const MockedVector3 = jest.mocked(rapier3d_compat_1.Vector3);
const MockedQuaternion = jest.mocked(rapier3d_compat_1.Quaternion);
describe('PhysicsWrapper', () => {
    let physicsWrapper;
    let mockRapierWorldInstance; // Use any for the mocked world instance
    beforeEach(() => {
        var _a;
        // Clear mocks before each test
        MockedWorld.mockClear();
        MockedVector3.mockClear();
        MockedQuaternion.mockClear();
        // Create a new instance of PhysicsWrapper, which will call the mocked RAPIER.World constructor
        physicsWrapper = new physics_wrapper_1.PhysicsWrapper();
        // Get the mock instance of World that was created by the PhysicsWrapper constructor
        mockRapierWorldInstance = (_a = MockedWorld.mock.results[0]) === null || _a === void 0 ? void 0 : _a.value;
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
