"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneSerializer = void 0;
const components_1 = require("@core/components");
const components_2 = require("@plugins/rigid-body/components");
const locationHelper_1 = require("../helpers/locationHelper");
class SceneSerializer {
    constructor() {
        this.componentConstructors = new Map();
        // Register component constructors for deserialization
        this.registerComponent(components_1.PositionComponent);
        this.registerComponent(components_1.RenderableComponent);
        this.registerComponent(components_1.RotationComponent);
        this.registerComponent(components_1.SelectableComponent);
        this.registerComponent(components_2.RigidBodyComponent);
        // Add other components as they are created
    }
    registerComponent(componentConstructor) {
        this.componentConstructors.set(componentConstructor.name, componentConstructor);
    }
    serialize(world) {
        const serializedEntities = [];
        for (const entityId of world.entityManager.getAllEntities()) {
            const components = [];
            const entityComponents = world.componentManager.getAllComponentsForEntity(entityId);
            for (const componentName in entityComponents) {
                const component = entityComponents[componentName];
                components.push({
                    type: componentName,
                    data: Object.assign({}, component) // Shallow copy for now
                });
            }
            serializedEntities.push({
                id: entityId,
                components: components,
            });
        }
        const scene = { entities: serializedEntities };
        return JSON.stringify(scene, null, 2);
    }
    deserialize(world, jsonString) {
        const scene = JSON.parse(jsonString);
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
                }
                else {
                    console.warn(`Unknown component type during deserialization: ${serializedComponent.type}`);
                }
            }
        }
    }
    saveToFile(world_1) {
        return __awaiter(this, arguments, void 0, function* (world, filename = 'scene.json') {
            try {
                const json = this.serialize(world);
                const fileHandle = yield window.showSaveFilePicker({
                    suggestedName: filename,
                    types: [{
                            description: 'Scene JSON',
                            accept: { 'application/json': ['.json'] },
                        }],
                });
                const writable = yield fileHandle.createWritable();
                yield writable.write(json);
                yield writable.close();
                console.log(`Scene saved to ${filename}`);
            }
            catch (error) {
                console.error("Failed to save file:", error);
                throw error;
            }
        });
    }
    loadFromFile(world, file) {
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
                    }
                    else {
                        reject(new Error("Failed to read file as string."));
                    }
                }
                catch (e) {
                    console.error("Failed to load scene from file:", e);
                    reject(e);
                }
            };
            reader.onerror = (event) => {
                var _a;
                console.error("File reader error:", reader.error);
                reject(new Error(`File could not be read: ${(_a = reader.error) === null || _a === void 0 ? void 0 : _a.message}`));
            };
            reader.readAsText(file);
        });
    }
    shareViaUrl(world) {
        const json = this.serialize(world);
        const encoded = btoa(json);
        // Always use /index.html for test compatibility
        const url = `${(0, locationHelper_1.getLocation)().origin}/index.html#scene=${encoded}`;
        console.log("Share URL:", url);
        return url;
    }
    loadFromUrl(world) {
        const hash = (0, locationHelper_1.getLocation)().hash;
        console.log("loadFromUrl - hash:", hash);
        if (hash.startsWith('#scene=')) {
            try {
                const encoded = hash.substring('#scene='.length);
                console.log("loadFromUrl - encoded:", encoded);
                const json = atob(encoded);
                this.deserialize(world, json);
                console.log("Scene loaded from URL.");
            }
            catch (e) {
                console.error("Failed to load scene from URL:", e);
            }
        }
    }
}
exports.SceneSerializer = SceneSerializer;
