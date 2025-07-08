import { System, World, IComponent } from '@core/ecs';
import { UIManager } from '../uiManager';
import { SelectableComponent } from '@core/components';

export class PropertyInspectorSystem extends System {
    private uiManager: UIManager;
    private lastSelectedEntity: number | null = null;

    constructor(uiManager: UIManager) {
        super();
        this.uiManager = uiManager;
    }

    public update(world: World, deltaTime: number): void {
        const selectableEntities = world.componentManager.getEntitiesWithComponents([SelectableComponent.name]);

        let selectedEntity: number | null = null;
        for (const entityId of selectableEntities) {
            const selectable = world.componentManager.getComponent(entityId, SelectableComponent.name) as SelectableComponent;
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