import { IComponent } from './IComponent';

export class ComponentManager {
    private componentStores = new Map<string, IComponent[]>();
    private componentConstructors = new Map<string, new (...args: any[]) => IComponent>();

    public registerComponent<T extends IComponent>(componentName: string, constructor: new (...args: any[]) => T): void {
        this.componentStores.set(componentName, []);
        this.componentConstructors.set(componentName, constructor);
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

    public getEntitiesWithComponents(componentConstructors: (new (...args: any[]) => IComponent)[]): number[] {
        const entities: number[] = [];
        if (componentConstructors.length === 0) {
            return [];
        }

        const componentNames = componentConstructors.map(c => c.name);

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

    public getAllComponentsForEntity(entityID: number): { [key: string]: IComponent } {
        const components: { [key: string]: IComponent } = {};
        for (const [componentName, store] of this.componentStores.entries()) {
            if (store[entityID] !== undefined) {
                components[componentName] = store[entityID];
            }
        }
        return components;
    }

    public updateComponent<T extends IComponent>(entityID: number, componentName: string, newComponent: T): void {
        const store = this.componentStores.get(componentName);
        if (store) {
            store[entityID] = newComponent;
        }
    }

    public hasComponent(entityID: number, componentName: string): boolean {
        return this.componentStores.get(componentName)?.[entityID] !== undefined;
    }

    public clear(): void {
        this.componentStores.clear();
        // Do NOT clear componentConstructors here; keep registrations for deserialization
    }
}