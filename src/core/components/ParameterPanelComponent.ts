import { Component } from "../ecs/Component";
import { IParameterPanel } from "../interfaces/IParameterPanel";
import { UIManager } from "../../studio/uiManager";
import { IComponent } from "../ecs/IComponent";

/**
 * Base class for parameter panels that define UI controls for components
 * This class implements the IParameterPanel interface and extends the Component base class
 * Plugin-specific parameter panels should extend this class
 */
export abstract class ParameterPanelComponent
  extends Component<ParameterPanelComponent>
  implements IParameterPanel
{
  /**
   * The type of the component, used for serialization and deserialization
   */
  static readonly type: string = "ParameterPanelComponent";

  /**
   * The component type this panel is associated with
   * This should be overridden by derived classes
   */
  abstract readonly componentType: string;

  /**
   * Creates a deep copy of this component
   * @returns A new instance of the component with the same properties
   */
  clone(): ParameterPanelComponent {
    const clone = new (this.constructor as new () => ParameterPanelComponent)();
    return clone.deserialize(this.serialize());
  }

  /**
   * Register UI controls for this parameter panel
   * This method should be implemented by derived classes
   * @param uiManager The UI manager to register controls with
   * @param component The component instance to bind controls to
   */
  abstract registerControls(uiManager: UIManager, component?: IComponent): void;

  /**
   * Update the UI controls when the component changes
   * This method should be implemented by derived classes
   * @param component The component instance that changed
   */
  abstract updateControls(component: IComponent): void;

  /**
   * Handle events from the UI controls
   * This method should be implemented by derived classes
   * @param event The event to handle
   * @param component The component instance to update
   */
  abstract handleEvent(event: string, component: IComponent): void;

  /**
   * Determines if the parameter panel is visible.
   * @returns True if the panel is visible, false otherwise.
   */
  public isVisible(): boolean {
    // Placeholder logic for visibility; update as needed
    return true;
  }
}
