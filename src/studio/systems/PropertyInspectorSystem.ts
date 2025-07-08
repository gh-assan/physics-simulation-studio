import { System, World } from '@core/ecs';
import { StudioUIManager } from '../uiManager';
import { IComponent } from '@core/ecs';

// Define a simple SelectableComponent for demonstration
export class SelectableComponent implements IComponent {
    constructor(public isSelected: boolean = false) {}
}

export class PropertyInspectorSystem extends System {
    private uiManager: StudioUIManager;
    private selectedEntity: number | null = null;

    constructor(uiManager: StudioUIManager) {
        super();
        this.uiManager = uiManager;
    }

    public update(world: World, deltaTime: number): void {
        // In a real application, this would listen to user input for selection
        // For now, let's just pick the first entity with a SelectableComponent if none is selected
        if (this.selectedEntity === null) {
            const selectableEntities = world.componentManager.getEntitiesWithComponents(['SelectableComponent']);
            if (selectableEntities.length > 0) {
                this.selectedEntity = selectableEntities[0];
                this.updatePropertyInspector(world);
            }
        }
    }

    private updatePropertyInspector(world: World): void {
        this.uiManager.clearControls();

        if (this.selectedEntity !== null) {
            const entityID = this.selectedEntity;
            // Iterate through all registered component types
            // This is a simplified approach; a more robust solution would involve iterating
            // through components actually attached to the entity.
            // For now, we'll just show a dummy component.

            // Example: Displaying a dummy component's properties
            const dummyComponent = { value: 10, enabled: true };
            this.uiManager.registerComponentControls('DummyComponent', dummyComponent);

            // In a real scenario, you would get actual components from the entity:
            // const components = world.componentManager.getAllComponentsForEntity(entityID);
            // for (const componentName in components) {
            //     this.uiManager.registerComponentControls(componentName, components[componentName]);
            // }
        }
    }
}
