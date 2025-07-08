"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemManager = void 0;
class SystemManager {
    constructor() {
        this.systems = [];
    }
    registerSystem(system) {
        this.systems.push(system);
    }
    updateAll(world, deltaTime) {
        for (const system of this.systems) {
            system.update(world, deltaTime);
        }
    }
}
exports.SystemManager = SystemManager;
