"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const PluginManager_1 = require("../PluginManager");
// Mocks
const mockWorld = {};
class MockPlugin {
    constructor(name, dependencies = []) {
        this.name = name;
        this.dependencies = dependencies;
        this.registered = false;
        this.unregistered = false;
    }
    getName() {
        return this.name;
    }
    getDependencies() {
        return this.dependencies;
    }
    register(world) {
        this.registered = true;
    }
    unregister() {
        this.unregistered = true;
    }
}
describe('PluginManager', () => {
    let pluginManager;
    let activationOrder;
    // A spy to track the order of plugin activation
    const originalActivatePlugin = PluginManager_1.PluginManager.prototype.activatePlugin;
    beforeAll(() => {
        PluginManager_1.PluginManager.prototype.activatePlugin = function (pluginName) {
            return __awaiter(this, void 0, void 0, function* () {
                activationOrder.push(pluginName);
                yield originalActivatePlugin.call(this, pluginName);
            });
        };
    });
    afterAll(() => {
        PluginManager_1.PluginManager.prototype.activatePlugin = originalActivatePlugin;
    });
    beforeEach(() => {
        pluginManager = new PluginManager_1.PluginManager(mockWorld);
        activationOrder = [];
    });
    it('should register and activate a simple plugin', () => __awaiter(void 0, void 0, void 0, function* () {
        const pluginA = new MockPlugin('A');
        pluginManager.registerPlugin(pluginA);
        yield pluginManager.activatePlugin('A');
        expect(pluginA.registered).toBe(true);
        expect(activationOrder).toEqual(['A']);
    }));
    it('should activate plugins with dependencies in the correct order', () => __awaiter(void 0, void 0, void 0, function* () {
        const pluginA = new MockPlugin('A');
        const pluginB = new MockPlugin('B', ['A']);
        pluginManager.registerPlugin(pluginA);
        pluginManager.registerPlugin(pluginB);
        yield pluginManager.activatePlugin('B');
        expect(pluginA.registered).toBe(true);
        expect(pluginB.registered).toBe(true);
        expect(activationOrder).toEqual(['B', 'A']);
    }));
    it('should handle complex dependency chains', () => __awaiter(void 0, void 0, void 0, function* () {
        const pluginA = new MockPlugin('A');
        const pluginB = new MockPlugin('B', ['A']);
        const pluginC = new MockPlugin('C', ['B']);
        const pluginD = new MockPlugin('D', ['C']);
        pluginManager.registerPlugin(pluginA);
        pluginManager.registerPlugin(pluginB);
        pluginManager.registerPlugin(pluginC);
        pluginManager.registerPlugin(pluginD);
        yield pluginManager.activatePlugin('D');
        expect(pluginA.registered).toBe(true);
        expect(pluginB.registered).toBe(true);
        expect(pluginC.registered).toBe(true);
        expect(pluginD.registered).toBe(true);
        expect(activationOrder).toEqual(['D', 'C', 'B', 'A']);
    }));
    it('should throw an error for missing dependencies', () => __awaiter(void 0, void 0, void 0, function* () {
        const pluginB = new MockPlugin('B', ['A']);
        pluginManager.registerPlugin(pluginB);
        yield expect(pluginManager.activatePlugin('B')).rejects.toThrow('Plugin "A" not found. Make sure it is registered.');
    }));
    it('should deactivate a plugin', () => __awaiter(void 0, void 0, void 0, function* () {
        const pluginA = new MockPlugin('A');
        pluginManager.registerPlugin(pluginA);
        yield pluginManager.activatePlugin('A');
        pluginManager.deactivatePlugin('A');
        expect(pluginA.unregistered).toBe(true);
    }));
});
