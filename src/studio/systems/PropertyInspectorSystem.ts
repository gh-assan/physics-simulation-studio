import { System } from '../../core/ecs/System';
import { World } from '../../core/ecs/World';
import { UIManager } from '../uiManager';
import { SelectableComponent } from '../../core/components/SelectableComponent';
import { IComponent } from '../../core/ecs/IComponent';

export class PropertyInspectorSystem extends System {
    private uiManager: UIManager;
    private lastSelectedEntity: number | null = null;

    constructor(uiManager: UIManager) {
        super();
        this.uiManager = uiManager;
    }

    public update(world: World, deltaTime: number): void {
        const selectableEntities = world.componentManager.getEntitiesWithComponents([SelectableComponent]);

        let currentSelectedEntity: number | null = null;

        for (const entityId of selectableEntities) {
            const selectable = world.componentManager.getComponent(entityId, SelectableComponent.name);
            if (selectable && selectable.isSelected) {
                currentSelectedEntity = entityId;
                break;
            }
        }

        if (currentSelectedEntity !== this.lastSelectedEntity) {
            this.lastSelectedEntity = currentSelectedEntity;
            this.uiManager.clearControls(); // Clear previous inspector content
            if (currentSelectedEntity !== null) {
                // For now, we'll just log and call a placeholder on UIManager
                console.log(`Selected entity: ${currentSelectedEntity}`);
                const components = world.componentManager.getAllComponentsForEntity(currentSelectedEntity);
                for (const componentName in components) {
                    if (Object.prototype.hasOwnProperty.call(components, componentName)) {
                        this.uiManager.registerComponentControls(componentName, components[componentName]);
                    }
                }
            } else {
                console.log("No entity selected.");
                // Clear inspector
            }
        }
    }
}
