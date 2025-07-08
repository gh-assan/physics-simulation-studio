import { World } from '@core/ecs';
import { IComponent } from '@core/ecs';

export class SceneSerializer {
    public serialize(world: World): string {
        const serializedEntities: any[] = [];

        // This is a simplified serialization. A real implementation would need to:
        // 1. Get all active entities from the EntityManager.
        // 2. For each entity, get all its attached components.
        // 3. Serialize the data of each component.
        // 4. Handle different component types and their specific serialization needs.

        // For demonstration, let's assume we have a way to get all entities and their components.
        // This part would typically involve iterating through the ComponentManager's internal stores
        // or having a method in World to expose this.

        // Since World doesn't expose a direct way to get all entities with all their components,
        // we'll create a dummy structure for now.
        const dummySerializedData = {
            entities: [
                {
                    id: 0,
                    components: {
                        PositionComponent: { x: 1, y: 2, z: 3 },
                        RenderableComponent: { geometryType: 'box', color: 0xff0000, width: 1, height: 1, depth: 1 },
                    },
                },
            ],
        };

        return JSON.stringify(dummySerializedData, null, 2);
    }

    public deserialize(jsonString: string, world: World): void {
        const data = JSON.parse(jsonString);

        // This is a simplified deserialization. A real implementation would need to:
        // 1. Clear the current world.
        // 2. Iterate through the serialized entities.
        // 3. Create new entities.
        // 4. Add components to them and populate with deserialized data.

        console.log("Deserializing scene:", data);
        // For now, we just log the data. Actual world reconstruction would go here.
    }

    public async saveToFile(world: World, filename: string = 'scene.json'): Promise<void> {
        const json = this.serialize(world);
        const blob = new Blob([json], { type: 'application/json' });

        // Using File System Access API for saving
        try {
            const handle = await (window as any).showSaveFilePicker({
                suggestedName: filename,
                types: [{
                    description: 'JSON File',
                    accept: { 'application/json': ['.json'] },
                }],
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            console.log(`Scene saved to ${filename}`);
        } catch (err) {
            console.error("Error saving file:", err);
        }
    }

    public async loadFromFile(world: World): Promise<void> {
        try {
            const [handle] = await (window as any).showOpenFilePicker({
                types: [{
                    description: 'JSON File',
                    accept: { 'application/json': ['.json'] },
                }],
                multiple: false,
            });
            const file = await handle.getFile();
            const jsonString = await file.text();
            this.deserialize(jsonString, world);
            console.log("Scene loaded from file.");
        } catch (err) {
            console.error("Error loading file:", err);
        }
    }

    // Placeholder for URL sharing logic
    public shareViaUrl(world: World): string {
        const json = this.serialize(world);
        // In a real scenario, you'd compress and base64 encode this.
        const encoded = btoa(json); // Simple Base64 encoding
        const url = `${window.location.origin}/index.html#scene=${encoded}`;
        console.log("Share URL:", url);
        return url;
    }

    public loadFromUrl(url: string, world: World): void {
        const hash = url.split('#scene=')[1];
        if (hash) {
            try {
                const decoded = atob(hash);
                this.deserialize(decoded, world);
                console.log("Scene loaded from URL.");
            } catch (err) {
                console.error("Error loading scene from URL:", err);
            }
        }
    }
}
