import { ParameterPanelComponent } from "../../core/components/ParameterPanelComponent";
import { UIManager } from "../uiManager";
import { IComponent } from "../../core/ecs/IComponent";

/**
 * A concrete implementation of ParameterPanelComponent for testing
 */
export class MockParameterPanelComponent extends ParameterPanelComponent {
  /**
   * The component type this panel is associated with
   */
  readonly componentType: string = "MockComponent";

  /**
   * Register UI controls for this parameter panel
   * @param uiManager The UI manager to register controls with
   * @param component The component instance to bind controls to
   */
  registerControls(uiManager: UIManager, component: IComponent): void {
    // No-op for testing
  }

  /**
   * Update the UI controls when the component changes
   * @param component The component instance that changed
   */
  updateControls(component: IComponent): void {
    // No-op for testing
  }

  /**
   * Handle events from the UI controls
   * @param event The event to handle
   * @param component The component instance to update
   */
  handleEvent(event: string, component: IComponent): void {
    // No-op for testing
  }
}
