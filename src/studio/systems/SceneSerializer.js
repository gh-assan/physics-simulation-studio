"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneSerializer = void 0;
class SceneSerializer {
    serialize(world) {
        const serializedEntities = [];
        // Iterate through all entities and their components
        // This is a simplified serialization. A more robust solution would handle component types and their specific data structures.
        for (const entityId of world.entityManager.getAllEntities()) {
            const components = {};
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
    deserialize(world, serializedScene) {
        const sceneData = JSON.parse(serializedScene);
        // Clear existing entities in the world
        world.entityManager.clear();
        world.componentManager.clear();
        for (const entityData of sceneData.entities) {
            const entityId = world.entityManager.createEntity(entityData.entityId);
            for (const componentName in entityData.components) {
                if (Object.prototype.hasOwnProperty.call(entityData.components, componentName)) {
                    // This is a simplified deserialization. In a real scenario, you'd need to map component names to actual classes
                    // and reconstruct them properly.
                    // For now, we'll assume the component data is directly assignable and the component name is the class name.
                    const componentConstructor = world.componentManager.componentConstructors.get(componentName);
                    if (componentConstructor) {
                        const componentInstance = new componentConstructor();
                        Object.assign(componentInstance, entityData.components[componentName]);
                        world.componentManager.addComponent(entityId, componentName, componentInstance);
                    }
                    else {
                        console.warn(`Unknown component type during deserialization: ${componentName}`);
                    }
                }
            }
        }
    }
    saveToFile(world, filename = 'scene.json') {
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
    loadFromFile(world) {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'application/json';
            input.onchange = (event) => {
                var _a;
                const file = (_a = event.target.files) === null || _a === void 0 ? void 0 : _a[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        var _a;
                        try {
                            this.deserialize(world, (_a = e.target) === null || _a === void 0 ? void 0 : _a.result);
                            resolve();
                        }
                        catch (error) {
                            reject(error);
                        }
                    };
                    reader.readAsText(file);
                }
                else {
                    reject(new Error('No file selected'));
                }
            };
            input.click();
        });
    }
    // Simplified URL parameter handling - for demonstration purposes
    serializeToUrl(world) {
        const serializedData = this.serialize(world);
        return btoa(serializedData); // Base64 encode
    }
    deserializeFromUrl(world, encodedData) {
        const decodedData = atob(encodedData); // Base64 decode
        this.deserialize(world, decodedData);
    }
}
exports.SceneSerializer = SceneSerializer;
