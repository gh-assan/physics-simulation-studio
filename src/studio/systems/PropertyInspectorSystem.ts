import {System} from '../../core/ecs/System';
import {World} from '../../core/ecs/World';
import {UIManager} from '../uiManager';
import {SelectableComponent} from '@core/components/SelectableComponent';
import {IComponent} from '../../core/ecs/IComponent';
import {extractComponentProperties} from '../utils/StudioUtils';

export class PropertyInspectorSystem extends System {
  private uiManager: UIManager;
  private lastSelectedEntity: number | null = null;

  constructor(uiManager: UIManager) {
    super();
    this.uiManager = uiManager;
  }

  public update(world: World, _deltaTime: number): void {
    const currentSelectedEntity = this._getSelectedEntity(world);

    if (currentSelectedEntity !== this.lastSelectedEntity) {
      this.lastSelectedEntity = currentSelectedEntity;
      this.uiManager.clearControls();

      if (currentSelectedEntity !== null) {
        const components = Object.values(
          world.componentManager.getAllComponentsForEntity(
            currentSelectedEntity,
          ),
        );
        this._populateInspector(components);
      }
    }
  }

  private _getSelectedEntity(world: World): number | null {
    const selectableEntities = world.componentManager.getEntitiesWithComponents(
      [SelectableComponent],
    );

    for (const entityId of selectableEntities) {
      const selectable = world.componentManager.getComponent(
        entityId,
        SelectableComponent.name,
      ) as SelectableComponent | undefined;
      if (selectable && selectable.isSelected) {
        return entityId;
      }
    }
    return null;
  }

  private _populateInspector(components: IComponent[]): void {
    components.forEach(component => {
      const properties = extractComponentProperties(component);
      this.uiManager.registerComponentControls(
        component.constructor.name,
        component,
        properties,
      );
    });
  }
}
