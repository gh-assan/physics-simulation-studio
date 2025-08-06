import { System } from "../../core/ecs/System";
import { World } from "../../core/ecs/World";
import { SelectableComponent } from "../../core/components/SelectableComponent";
import { Studio } from "../Studio";
import { Logger } from "../../core/utils/Logger";

export class SelectionSystem extends System {
  private studio: Studio;
  private currentSelectedEntity = -1; // Use -1 to indicate no selection
  private world: World; // Add world property

  constructor(studio: Studio, world: World) { // Add world parameter
    super(500);
    this.studio = studio;
    this.world = world; // Store world

    // TODO: Add event listener for mouse clicks on renderable entities
  }

  public setSelectedEntity(entityId: number): void {
    if (this.currentSelectedEntity === entityId) {
      return; // No change
    }

    // Deselect previous entity
    if (this.currentSelectedEntity !== -1) {
      const prevSelectable = this.world.componentManager.getComponent(
        this.currentSelectedEntity,
        SelectableComponent.type
      ) as SelectableComponent;
      if (prevSelectable) {
        prevSelectable.isSelected = false;
      }
    }

    // Select new entity
    this.currentSelectedEntity = entityId;
    if (this.currentSelectedEntity !== -1) {
      const newSelectable = this.world.componentManager.getComponent(
        this.currentSelectedEntity,
        SelectableComponent.type
      ) as SelectableComponent;
      if (newSelectable) {
        newSelectable.isSelected = true;
      }
    }

    Logger.getInstance().log(`[SelectionSystem] Selected entity: ${this.currentSelectedEntity}`);
  }

  public clearSelection(): void {
    this.setSelectedEntity(-1);
  }

  public getSelectedEntity(): number {
    return this.currentSelectedEntity;
  }

  public hasSelection(): boolean {
    return this.currentSelectedEntity !== -1;
  }

  public update(world: World, deltaTime: number): void {
    // Selection logic is primarily event-driven, but this update method can be used
    // for any continuous selection-related checks if needed.
  }
}
