export class EntityManager {
    private nextEntityID = 0;
    private availableEntityIDs: number[] = [];
    private activeEntities: Set<number> = new Set();

    public createEntity(id?: number): number {
        let entityId: number;
        if (id !== undefined) {
            entityId = id;
            if (this.activeEntities.has(entityId)) {
                console.warn(`Entity with ID ${entityId} already exists. Creating a new one.`);
                entityId = this.nextEntityID++;
            } else if (entityId >= this.nextEntityID) {
                this.nextEntityID = entityId + 1;
            }
        } else if (this.availableEntityIDs.length > 0) {
            entityId = this.availableEntityIDs.pop()!;
        } else {
            entityId = this.nextEntityID++;
        }
        this.activeEntities.add(entityId);
        return entityId;
    }

    public destroyEntity(entityID: number): void {
        this.availableEntityIDs.push(entityID);
        this.activeEntities.delete(entityID);
    }

    public getAllEntities(): Set<number> {
        return this.activeEntities;
    }

    public hasEntity(entityID: number): boolean {
        return this.activeEntities.has(entityID);
    }
}