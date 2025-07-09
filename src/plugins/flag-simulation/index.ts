import { World } from "../../core/ecs/World";
import { ISimulationPlugin } from "../../core/plugin/ISimulationPlugin";
import { FlagComponent } from "./FlagComponent";
import { FlagSystem } from "./FlagSystem";
import { PositionComponent } from "../../core/components/PositionComponent";
import { RenderableComponent } from "../../core/components/RenderableComponent";
import { SelectableComponent } from "../../core/components/SelectableComponent";

export { FlagComponent } from "./FlagComponent";
export { FlagSystem } from "./FlagSystem";

export class FlagSimulationPlugin implements ISimulationPlugin {
  private _flagSystem: FlagSystem | null = null;

  getName(): string {
    return "flag-simulation";
  }
  getDependencies(): string[] {
    return [];
  }
  register(world: World): void {
    world.componentManager.registerComponent(FlagComponent.name, FlagComponent);
    this._flagSystem = new FlagSystem();
    world.systemManager.registerSystem(this._flagSystem);
    console.log("FlagSimulationPlugin registered.");
  }
  unregister(): void {
    if (this._flagSystem) {
      this._flagSystem.unregister();
      this._flagSystem = null;
    }
  }

  initializeEntities(world: World): void {
    // Create flag entity
    const flagEntity = world.entityManager.createEntity();
    console.log("[FlagSimulationPlugin] Created flag entity:", flagEntity);
    world.componentManager.addComponent(
      flagEntity,
      PositionComponent.name,
      new PositionComponent(0, 0, -10)
    );
    world.componentManager.addComponent(
      flagEntity,
      RenderableComponent.name,
      new RenderableComponent("plane", "#00ff00")
    ); // Green flag
    world.componentManager.addComponent(
      flagEntity,
      FlagComponent.name,
      new FlagComponent(20, 12, 20, 12)
    );
    world.componentManager.addComponent(
      flagEntity,
      SelectableComponent.name,
      new SelectableComponent()
    );
    // Log all components for this entity
    const comps = world.componentManager.getAllComponentsForEntity(flagEntity);
    console.log("[FlagSimulationPlugin] Components for flag entity:", comps);
  }
}
