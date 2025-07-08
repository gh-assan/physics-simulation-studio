import { System, World, IComponent } from '@core/ecs';
import { StudioUIManager } from '../uiManager';
import { SelectableComponent } from '@core/components';

export class PropertyInspectorSystem extends System {
    private uiManager: StudioUIManager;
    private lastSelectedEntity: number | null = null;

    constructor(uiManager: StudioUIManager) {
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
                for (const component of components) {
                    // For now, we'll just register a dummy component. 
                    // In a real scenario, we'd iterate through component properties
                    // and register controls based on their types and metadata.
                    this.uiManager.registerComponentControls(component.constructor.name, component);
                }
            }
        }
    }
}