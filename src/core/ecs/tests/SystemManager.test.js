"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SystemManager_1 = require("../SystemManager");
const System_1 = require("../System");
const World_1 = require("../World");
class TestSystem extends System_1.System {
    constructor() {
        super(...arguments);
        this.updated = false;
    }
    update(world, deltaTime) {
        this.updated = true;
    }
}
describe('SystemManager', () => {
    let systemManager;
    let world;
    beforeEach(() => {
        systemManager = new SystemManager_1.SystemManager();
        world = new World_1.World();
    });
    it('should register and update a system', () => {
        const system = new TestSystem();
        systemManager.registerSystem(system);
        systemManager.updateAll(world, 0.16);
        expect(system.updated).toBe(true);
    });
});
