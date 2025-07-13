import { IComponent } from "../../core/ecs/IComponent";
import { Logger } from "../../core/utils/Logger";

/**
 * Utility class for filtering components based on various criteria.
 */
export class ComponentFilter {
  /**
   * Checks if a component should be skipped from UI display.
   * Currently skips SelectableComponent and RenderableComponent.
   * @param componentName The name of the component.
   * @returns True if the component should be skipped, false otherwise.
   */
  public static shouldSkipFromUI(componentName: string): boolean {
    if (
      componentName === "SelectableComponent" ||
      componentName === "RenderableComponent"
    ) {
      Logger.log(
        `[ComponentFilter] Skipping component '${componentName}' as it is hidden from the UI`
      );
      return true;
    }
    return false;
  }

  /**
   * Checks if a component's simulation type matches the active simulation.
   * @param component The component instance.
   * @param activeSimulationName The name of the currently active simulation.
   * @returns True if the component's simulation type matches or if no simulation type is defined for the component, false otherwise.
   */
  public static matchesActiveSimulation(
    component: IComponent,
    activeSimulationName: string | null
  ): boolean {
    // If no active simulation, or component has no simulationType, it matches.
    if (!activeSimulationName || !component.simulationType) {
      return true;
    }

    if (component.simulationType !== activeSimulationName) {
      Logger.log(
        `[ComponentFilter] Skipping component (simulationType: ${component.simulationType}) as it does not match active simulation '${activeSimulationName}'`
      );
      return false;
    }
    return true;
  }
}
