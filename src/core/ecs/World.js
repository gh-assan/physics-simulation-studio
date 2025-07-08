"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.World = void 0;
const EntityManager_1 = require("./EntityManager");
const ComponentManager_1 = require("./ComponentManager");
const SystemManager_1 = require("./SystemManager");
class World {
    constructor() {
        this.entityManager = new EntityManager_1.EntityManager();
        this.componentManager = new ComponentManager_1.ComponentManager();
        this.systemManager = new SystemManager_1.SystemManager();
    }
    update(deltaTime) {
        this.systemManager.updateAll(this, deltaTime);
    }
}
exports.World = World;
