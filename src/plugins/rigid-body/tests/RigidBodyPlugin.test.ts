import RigidBodyPlugin from '../index';
import { World } from '@core/ecs';
import { PhysicsSystem } from '../system';
import { RigidBodyComponent } from '../components';

describe('RigidBodyPlugin', () => {
    let world: World;
    let plugin: RigidBodyPlugin;

    beforeEach(() => {
        world = new World();
        plugin = new RigidBodyPlugin();

        // Spy on the registerComponent and registerSystem methods
        jest.spyOn(world.componentManager, 'registerComponent');
        jest.spyOn(world.systemManager, 'registerSystem');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should return the correct name and no dependencies', () => {
        expect(plugin.getName()).toBe('rigid-body-physics-rapier');
        expect(plugin.getDependencies()).toEqual([]);
    });

    it('should register RigidBodyComponent and PhysicsSystem when activated', () => {
        plugin.register(world);

        expect(world.componentManager.registerComponent).toHaveBeenCalledWith(RigidBodyComponent.name, RigidBodyComponent);
        expect(world.systemManager.registerSystem).toHaveBeenCalledTimes(1);
        expect(world.systemManager.registerSystem).toHaveBeenCalledWith(expect.any(PhysicsSystem));
    });

    it('should log messages on register and unregister', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        plugin.register(world);
        expect(consoleSpy).toHaveBeenCalledWith('Registering RigidBodyPlugin...');

        plugin.unregister();
        expect(consoleSpy).toHaveBeenCalledWith('Unregistering RigidBodyPlugin...');

        consoleSpy.mockRestore();
    });
});
