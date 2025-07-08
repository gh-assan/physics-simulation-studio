import { IComponent } from './IComponent';

export class ComponentManager {
    private componentStores = new Map<string, IComponent[]>();

    public registerComponent(componentName: string): void {
        this.componentStores.set(componentName, []);
    }

    public addComponent<T extends IComponent>(entityID: number, componentName: string, component: T): void {
        this.componentStores.get(componentName)![entityID] = component;
    }

    public getComponent<T extends IComponent>(entityID: number, componentName: string): T | undefined {
        return this.componentStores.get(componentName)?.[entityID] as T;
    }

    public removeComponent(entityID: number, componentName: string): void {
        const store = this.componentStores.get(componentName);
        if (store) {
            delete store[entityID];
        }
    }

    public getEntitiesWithComponents(componentNames: string[]): number[] {
        const entities: number[] = [];
        if (componentNames.length === 0) {
            return [];
        }

        const firstStore = this.componentStores.get(componentNames[0]);
        if (!firstStore) {
            return [];
        }

        for (let i = 0; i < firstStore.length; i++) {
            if (firstStore[i] !== undefined) {
                let hasAllComponents = true;
                for (let j = 1; j < componentNames.length; j++) {
                    if (this.componentStores.get(componentNames[j])?.[i] === undefined) {
                        hasAllComponents = false;
                        break;
                    }
                }
                if (hasAllComponents) {
                    entities.push(i);
                }
            }
        }
        return entities;
    }
}
