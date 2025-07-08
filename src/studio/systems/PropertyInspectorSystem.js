"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyInspectorSystem = void 0;
const ecs_1 = require("@core/ecs");
const components_1 = require("@core/components");
class PropertyInspectorSystem extends ecs_1.System {
    constructor(uiManager) {
        super();
        this.lastSelectedEntity = null;
        this.uiManager = uiManager;
    }
    update(world, deltaTime) {
        const selectableEntities = world.componentManager.getEntitiesWithComponents([components_1.SelectableComponent.name]);
        let selectedEntity = null;
        for (const entityId of selectableEntities) {
            const selectable = world.componentManager.getComponent(entityId, components_1.SelectableComponent.name);
            if (selectable && selectable.isSelected) {
                selectedEntity = entityId;
                break;
            }
        }
        if (selectedEntity !== this.lastSelectedEntity) {
            this.uiManager.clearControls();
            this.lastSelectedEntity = selectedEntity;
            if (selectedEntity !== null) {
                const components = world.componentManager.getAllComponentsForEntity(selectedEntity);
                for (const componentName in components) {
                    const component = components[componentName];
                    this.uiManager.registerComponentControls(componentName, component);
                }
            }
        }
    }
}
exports.PropertyInspectorSystem = PropertyInspectorSystem;
