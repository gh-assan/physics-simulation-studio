/**
 * Interface for parameter panels that define UI controls for components
 * This interface defines the contract for parameter panels that plugins can implement
 * to provide custom UI controls for their components.
 */
export interface IParameterPanel {
  /**
   * The component type this panel is associated with
   */
  readonly componentType: string;

  /**
   * Register UI controls for this parameter panel
   * @param uiManager The UI manager to register controls with
   * @param component The component instance to bind controls to
   */
  registerControls(uiManager: any, component: any): void;

  /**
   * Update the UI controls when the component changes
   * @param component The component instance that changed
   */
  updateControls(component: any): void;

  /**
   * Handle events from the UI controls
   * @param event The event to handle
   * @param component The component instance to update
   */
  handleEvent(event: string, component: any): void;
}
