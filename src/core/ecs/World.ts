import { EntityManager } from './EntityManager';
import { ComponentManager } from './ComponentManager';
import { SystemManager } from './SystemManager';

export class World {
    public entityManager = new EntityManager();
    public componentManager = new ComponentManager();
    public systemManager = new SystemManager();

    public update(deltaTime: number): void {
        this.systemManager.updateAll(this, deltaTime);
    }
}
