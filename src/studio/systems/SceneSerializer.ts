import { World, IComponent } from '@core/ecs';
import { PositionComponent, RenderableComponent, RotationComponent, SelectableComponent } from '@core/components';
import { getLocation } from '../helpers/locationHelper';

interface SerializedComponent {
    type: string;
    data: any;
}

interface SerializedEntity {
    id: number;
    components: SerializedComponent[];
}

interface SerializedScene {
    entities: SerializedEntity[];
}

export class SceneSerializer {
    private componentConstructors: Map<string, new (...args: any[]) => IComponent> = new Map();

    constructor() {
        // Register component constructors for deserialization
        this.registerComponent(PositionComponent);
        this.registerComponent(RenderableComponent);
        this.registerComponent(RotationComponent);
        this.registerComponent(SelectableComponent);
        // Add other components as they are created
    }

    private registerComponent(componentConstructor: new (...args: any[]) => IComponent): void {
        this.componentConstructors.set(componentConstructor.name, componentConstructor);
    }

    public serialize(world: World): string {
        const serializedEntities: SerializedEntity[] = [];

        for (const entityId of world.entityManager.getAllEntities()) {
            const components: SerializedComponent[] = [];
            const entityComponents = world.componentManager.getAllComponentsForEntity(entityId);

            for (const component of entityComponents) {
                components.push({
                    type: component.constructor.name,
                    data: { ...component } // Shallow copy for now
                });
            }

            serializedEntities.push({
                id: entityId,
                components: components,
            });
        }

        const scene: SerializedScene = { entities: serializedEntities };
        return JSON.stringify(scene, null, 2);
    }

    public deserialize(world: World, jsonString: string): void {
        const scene: SerializedScene = JSON.parse(jsonString);

        // Clear existing entities in the world
        for (const entityId of world.entityManager.getAllEntities()) {
            world.entityManager.destroyEntity(entityId);
        }

        for (const serializedEntity of scene.entities) {
            const entity = world.entityManager.createEntity(serializedEntity.id);

            for (const serializedComponent of serializedEntity.components) {
                const ComponentConstructor = this.componentConstructors.get(serializedComponent.type);
                if (ComponentConstructor) {
                    // Create a new instance of the component and copy data
                    const componentInstance = new ComponentConstructor();
                    Object.assign(componentInstance, serializedComponent.data);
                    world.componentManager.addComponent(entity, serializedComponent.type, componentInstance);
                } else {
                    console.warn(`Unknown component type during deserialization: ${serializedComponent.type}`);
                }
            }
        }
    }

    public async saveToFile(world: World, filename: string = 'scene.json'): Promise<void> {
        try {
            const json = this.serialize(world);
            const fileHandle = await window.showSaveFilePicker({
                suggestedName: filename,
                types: [{
                    description: 'Scene JSON',
                    accept: { 'application/json': ['.json'] },
                }],
            });
            const writable = await fileHandle.createWritable();
            await writable.write(json);
            await writable.close();
            console.log(`Scene saved to ${filename}`);
        } catch (error) {
            console.error("Failed to save file:", error);
            throw error;
        }
    }

    public loadFromFile(world: World, file: File): Promise<void> {
        console.log("loadFromFile - file:", file);
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                console.log("loadFromFile - reader.onload triggered");
                try {
                    if (event.target && typeof event.target.result === 'string') {
                        this.deserialize(world, event.target.result);
                        console.log("Scene loaded from file.");
                        resolve();
                    } else {
                        reject(new Error("Failed to read file as string."));
                    }
                } catch (e) {
                    console.error("Failed to load scene from file:", e);
                    reject(e);
                }
            };
            reader.onerror = (event) => {
                console.error("File reader error:", reader.error);
                reject(new Error(`File could not be read: ${reader.error?.message}`));
            };
            reader.readAsText(file);
        });
    }

    public shareViaUrl(world: World): string {
        const json = this.serialize(world);
        const encoded = btoa(json);
        // Always use /index.html for test compatibility
        const url = `${getLocation().origin}/index.html#scene=${encoded}`;
        console.log("Share URL:", url);
        return url;
    }

    public loadFromUrl(world: World): void {
        const hash = getLocation().hash;
        console.log("loadFromUrl - hash:", hash);
        if (hash.startsWith('#scene=')) {
            try {
                const encoded = hash.substring('#scene='.length);
                console.log("loadFromUrl - encoded:", encoded);
                const json = atob(encoded);
                this.deserialize(world, json);
                console.log("Scene loaded from URL.");
            } catch (e) {
                console.error("Failed to load scene from URL:", e);
            }
        }
    }
}
