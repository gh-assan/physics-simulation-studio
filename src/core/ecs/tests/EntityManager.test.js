"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EntityManager_1 = require("../EntityManager");
describe('EntityManager', () => {
    let entityManager;
    beforeEach(() => {
        entityManager = new EntityManager_1.EntityManager();
    });
    it('should create a new entity with a unique ID', () => {
        const entity1 = entityManager.createEntity();
        const entity2 = entityManager.createEntity();
        expect(entity1).not.toBe(entity2);
    });
    it('should reuse destroyed entity IDs', () => {
        const entity1 = entityManager.createEntity();
        entityManager.destroyEntity(entity1);
        const entity2 = entityManager.createEntity();
        expect(entity1).toBe(entity2);
    });
});
