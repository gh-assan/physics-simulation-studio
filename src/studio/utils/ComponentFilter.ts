import { IComponent } from "../../core/ecs/IComponent";
import { Logger } from "../../core/utils/Logger";

export function shouldDisplayComponent(
  componentName: string,
  component: IComponent,
  activeSimulation?: string | null
): boolean {
  if (
    componentName === "SelectableComponent" ||
    componentName === "RenderableComponent"
  ) {
    Logger.log(
      `[ComponentFilter] Skipping component '${componentName}' as it is hidden from the UI`
    );
    return false;
  }

  if (activeSimulation && component.simulationType) {
    if (component.simulationType !== activeSimulation) {
      Logger.log(
        `[ComponentFilter] Skipping component '${componentName}' (simulationType: ${component.simulationType}) as it does not match active simulation '${activeSimulation}'`
      );
      return false;
    }
  }

  return true;
}
