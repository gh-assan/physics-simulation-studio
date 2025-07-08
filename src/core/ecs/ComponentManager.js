"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComponentManager = void 0;
class ComponentManager {
    constructor() {
        this.componentStores = new Map();
        this.componentConstructors = new Map();
    }
    registerComponent(componentName, constructor) {
        this.componentStores.set(componentName, []);
        this.componentConstructors.set(componentName, constructor);
    }
    addComponent(entityID, componentName, component) {
        if (!this.componentStores.has(componentName)) {
            this.componentStores.set(componentName, []);
        }
        this.componentStores.get(componentName)[entityID] = component;
    }
    getComponent(entityID, componentName) {
        var _a;
        return (_a = this.componentStores.get(componentName)) === null || _a === void 0 ? void 0 : _a[entityID];
    }
    removeComponent(entityID, componentName) {
        const store = this.componentStores.get(componentName);
        if (store) {
            delete store[entityID];
        }
    }
    getEntitiesWithComponents(componentConstructors) {
        var _a;
        const entities = [];
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
                    if (((_a = this.componentStores.get(componentNames[j])) === null || _a === void 0 ? void 0 : _a[i]) === undefined) {
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
    getAllComponentsForEntity(entityID) {
        const components = {};
        for (const [componentName, store] of this.componentStores.entries()) {
            if (store[entityID] !== undefined) {
                components[componentName] = store[entityID];
            }
        }
        return components;
    }
    updateComponent(entityID, componentName, newComponent) {
        const store = this.componentStores.get(componentName);
        if (store) {
            store[entityID] = newComponent;
        }
    }
    hasComponent(entityID, componentName) {
        var _a;
        return ((_a = this.componentStores.get(componentName)) === null || _a === void 0 ? void 0 : _a[entityID]) !== undefined;
    }
    clear() {
        this.componentStores.clear();
        // Do NOT clear componentConstructors here; keep registrations for deserialization
    }
}
exports.ComponentManager = ComponentManager;
