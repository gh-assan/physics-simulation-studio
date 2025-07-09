import {PhysicsWrapper} from '../physics-wrapper';

jest.mock('@dimforge/rapier3d-compat', () => ({
  __esModule: true,
  default: {
    init: jest.fn(() => Promise.resolve()),
    World: jest.fn().mockImplementation(() => ({
      step: jest.fn(),
      timestep: 0,
    })),
    Vector3: jest.fn().mockImplementation((x, y, z) => ({x, y, z})),
    Quaternion: jest.fn().mockImplementation((x, y, z, w) => ({x, y, z, w})),
  },
}));

const RAPIER = jest.requireMock('@dimforge/rapier3d-compat').default;
const MockedWorld = RAPIER.World;
const MockedVector3 = RAPIER.Vector3;
const MockedQuaternion = RAPIER.Quaternion;

describe('PhysicsWrapper', () => {
  let physicsWrapper: PhysicsWrapper;
  let mockRapierWorldInstance: {step: jest.Mock; timestep: number}; // Use a more specific type for the mocked world instance

    beforeEach(async () => {
    // Clear mocks before each test
    MockedWorld.mockClear();
    MockedVector3.mockClear();
    MockedQuaternion.mockClear();

    // Create a new instance of PhysicsWrapper, which will call the mocked RAPIER.World constructor
    physicsWrapper = await PhysicsWrapper.create();

    // Get the mock instance of World that was created by the PhysicsWrapper constructor
    mockRapierWorldInstance = MockedWorld.mock.results[0]?.value;
  });

  it('should initialize the Rapier world with gravity', () => {
    expect(MockedWorld).toHaveBeenCalledTimes(1);
    expect(MockedWorld).toHaveBeenCalledWith(
      expect.objectContaining({x: 0.0, y: -9.81, z: 0.0}),
    );
    expect(physicsWrapper.world).toBe(mockRapierWorldInstance);
  });

  it('should call world.step() when step is called', () => {
    physicsWrapper.step(0.16);
    expect(mockRapierWorldInstance.step).toHaveBeenCalledTimes(1);
    expect(physicsWrapper.world.timestep).toBeCloseTo(1.0 / 60.0);
  });
});
