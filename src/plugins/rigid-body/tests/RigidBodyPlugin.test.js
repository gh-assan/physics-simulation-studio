"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = __importDefault(require("../index"));
const ecs_1 = require("@core/ecs");
const system_1 = require("../system");
describe('RigidBodyPlugin', () => {
    let world;
    let plugin;
    beforeEach(() => {
        world = new ecs_1.World();
        plugin = new index_1.default();
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
        expect(world.componentManager.registerComponent).toHaveBeenCalledWith('RigidBodyComponent');
        expect(world.systemManager.registerSystem).toHaveBeenCalledTimes(1);
        expect(world.systemManager.registerSystem).toHaveBeenCalledWith(expect.any(system_1.PhysicsSystem));
    });
    it('should log messages on register and unregister', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
        plugin.register(world);
        expect(consoleSpy).toHaveBeenCalledWith('Registering RigidBodyPlugin...');
        plugin.unregister();
        expect(consoleSpy).toHaveBeenCalledWith('Unregistering RigidBodyPlugin...');
        consoleSpy.mockRestore();
    });
});
