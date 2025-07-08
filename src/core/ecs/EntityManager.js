"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityManager = void 0;
class EntityManager {
    constructor() {
        this.nextEntityID = 0;
        this.availableEntityIDs = [];
        this.activeEntities = new Set();
    }
    createEntity(id) {
        let entityId;
        if (id !== undefined) {
            entityId = id;
            if (this.activeEntities.has(entityId)) {
                console.warn(`Entity with ID ${entityId} already exists. Creating a new one.`);
                entityId = this.nextEntityID++;
            }
            else if (entityId >= this.nextEntityID) {
                this.nextEntityID = entityId + 1;
            }
        }
        else if (this.availableEntityIDs.length > 0) {
            entityId = this.availableEntityIDs.pop();
        }
        else {
            entityId = this.nextEntityID++;
        }
        this.activeEntities.add(entityId);
        return entityId;
    }
    destroyEntity(entityID) {
        this.availableEntityIDs.push(entityID);
        this.activeEntities.delete(entityID);
    }
    getAllEntities() {
        return this.activeEntities;
    }
    hasEntity(entityID) {
        return this.activeEntities.has(entityID);
    }
    clear() {
        this.nextEntityID = 0;
        this.availableEntityIDs = [];
        this.activeEntities.clear();
    }
}
exports.EntityManager = EntityManager;
