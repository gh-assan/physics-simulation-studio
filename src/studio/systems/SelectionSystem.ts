import { System } from "../../core/ecs/System";
import { World } from "../../core/ecs/World";
import { SelectableComponent } from "../../core/components/SelectableComponent";
import { Studio } from "../Studio";
import { Logger } from "../../core/utils/Logger";

export class SelectionSystem extends System {
  private studio: Studio;
  private currentSelectedEntity: number | null = null;
  private world: World; // Add world property

  constructor(studio: Studio, world: World) { // Add world parameter
    super();
    this.studio = studio;
    this.world = world; // Store world

    // Listen for simulation-loaded events to set a default selection
    window.addEventListener(
      "simulation-loaded",
      this.onSimulationLoaded.bind(this) as EventListener
    );

    // TODO: Add event listener for mouse clicks on renderable entities
  }

  private onSimulationLoaded(event: CustomEvent): void {
    Logger.log(
      `[SelectionSystem] Received simulation-loaded event for ${event.detail.simulationName}`
    );
    this.setDefaultSelectedEntity();
  }

  private setDefaultSelectedEntity(): void {
    const selectableEntities = this.world.componentManager.getEntitiesWithComponents(
      [SelectableComponent]
    );

    const currentActiveSimulation = this.studio.getActiveSimulationName();

    // If no entity is currently selected, select the first one matching the active simulation by default
    if (this.currentSelectedEntity === null) {
      for (const entityId of selectableEntities) {
        const selectable = this.world.componentManager.getComponent(
          entityId,
          SelectableComponent.type || SelectableComponent.name
        ) as SelectableComponent;

        if (
          selectable &&
          (!currentActiveSimulation ||
            !(selectable as any).simulationType ||
            (selectable as any).simulationType === currentActiveSimulation)
        ) {
          this.setSelectedEntity(entityId);
          return;
        }
      }
    }
  }

  public setSelectedEntity(entityId: number | null): void {
    if (this.currentSelectedEntity === entityId) {
      return; // No change
    }

    // Deselect previous entity
    if (this.currentSelectedEntity !== null) {
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
    if (this.currentSelectedEntity !== null) {
      const newSelectable = this.world.componentManager.getComponent(
        this.currentSelectedEntity,
        SelectableComponent.type
      ) as SelectableComponent;
      if (newSelectable) {
        newSelectable.isSelected = true;
      }
    }

    Logger.log(`[SelectionSystem] Selected entity: ${this.currentSelectedEntity}`);
  }

  public getSelectedEntity(): number | null {
    return this.currentSelectedEntity;
  }

  public update(world: World, deltaTime: number): void {
    // Selection logic is primarily event-driven, but this update method can be used
    // for any continuous selection-related checks if needed.
  }
}
