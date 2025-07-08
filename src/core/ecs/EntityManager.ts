export class EntityManager {
    private nextEntityID = 0;
    private availableEntityIDs: number[] = [];

    public createEntity(): number {
        if (this.availableEntityIDs.length > 0) {
            return this.availableEntityIDs.pop()!;
        }
        return this.nextEntityID++;
    }

    public destroyEntity(entityID: number): void {
        this.availableEntityIDs.push(entityID);
    }
}
