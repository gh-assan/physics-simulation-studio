"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyInspectorSystem = void 0;
const System_1 = require("../../core/ecs/System");
const SelectableComponent_1 = require("../../core/components/SelectableComponent");
class PropertyInspectorSystem extends System_1.System {
    constructor(uiManager) {
        super();
        this.lastSelectedEntity = null;
        this.uiManager = uiManager;
    }
    update(world, deltaTime) {
        const selectableEntities = world.componentManager.getEntitiesWithComponents([SelectableComponent_1.SelectableComponent]);
        let currentSelectedEntity = null;
        for (const entityId of selectableEntities) {
            const selectable = world.componentManager.getComponent(entityId, SelectableComponent_1.SelectableComponent.name);
            if (selectable && selectable.isSelected) {
                currentSelectedEntity = entityId;
                break;
            }
        }
        if (currentSelectedEntity !== this.lastSelectedEntity) {
            this.lastSelectedEntity = currentSelectedEntity;
            if (currentSelectedEntity !== null) {
                // Clear previous inspector content and populate with new entity's components
                this.uiManager.clearControls();
                console.log(`Selected entity: ${currentSelectedEntity}`);
                const components = world.componentManager.getAllComponentsForEntity(currentSelectedEntity);
                for (const componentName in components) {
                    if (Object.prototype.hasOwnProperty.call(components, componentName)) {
                        this.uiManager.registerComponentControls(componentName, components[componentName]);
                    }
                }
            }
            else {
                console.log("No entity selected.");
                // Clear inspector
            }
        }
    }
}
exports.PropertyInspectorSystem = PropertyInspectorSystem;
