import { World } from '../../core/ecs/World';
import { IComponent } from '../../core/ecs/IComponent';

export class SceneSerializer {
    public serialize(world: World): string {
        const serializedEntities: any[] = [];

        // Iterate through all entities and their components
        // This is a simplified serialization. A more robust solution would handle component types and their specific data structures.
        for (const entityId of world.entityManager.getAllEntities()) {
            const components: { [key: string]: IComponent } = {};
            const entityComponents = world.componentManager.getAllComponentsForEntity(entityId);
            for (const componentName in entityComponents) {
                if (Object.prototype.hasOwnProperty.call(entityComponents, componentName)) {
                    components[componentName] = entityComponents[componentName];
                }
            }
            serializedEntities.push({ entityId, components });
        }

        return JSON.stringify({ entities: serializedEntities }, null, 2);
    }

    public deserialize(world: World, serializedScene: string): void {
        const sceneData = JSON.parse(serializedScene);

        // Clear existing entities in the world
        world.entityManager.clear();
        world.componentManager.clear();

        for (const entityData of sceneData.entities) {
            const entityId = world.entityManager.createEntity(entityData.entityId);
            for (const componentName in entityData.components) {
                if (Object.prototype.hasOwnProperty.call(entityData.components, componentName)) {
                    const componentConstructor = (world.componentManager as any).componentConstructors.get(componentName);
                    if (componentConstructor) {
                        const componentInstance = new componentConstructor();
                        Object.assign(componentInstance, entityData.components[componentName]);
                        world.componentManager.addComponent(entityId, componentName, componentInstance);
                    } else {
                        console.warn(`Unknown component type during deserialization: ${componentName}`);
                    }
                }
            }
        }
    }

    public saveToFile(world: World, filename: string = 'scene.json'): void {
        const serializedData = this.serialize(world);
        const blob = new Blob([serializedData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    public loadFromFile(world: World): Promise<void> {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'application/json';

            input.onchange = (event: Event) => {
                const file = (event.target as HTMLInputElement).files?.[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            this.deserialize(world, e.target?.result as string);
                            resolve();
                        } catch (error) {
                            reject(error);
                        }
                    };
                    reader.readAsText(file);
                } else {
                    reject(new Error('No file selected'));
                }
            };

            input.click();
        });
    }

    // Simplified URL parameter handling - for demonstration purposes
    public serializeToUrl(world: World): string {
        const serializedData = this.serialize(world);
        return btoa(serializedData); // Base64 encode
    }

    public deserializeFromUrl(world: World, encodedData: string): void {
        const decodedData = atob(encodedData); // Base64 decode
        this.deserialize(world, decodedData);
    }
}