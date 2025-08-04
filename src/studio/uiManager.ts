import { Logger } from "../core/utils/Logger";
import { ApplicationEventBus } from "./utils/ApplicationEventBus";
import { ComponentPropertyPreparer } from "./utils/ComponentPropertyPreparer";
import { Pane, FolderApi } from "tweakpane";
import { ComponentControlProperty } from "./types";
import { IUIManager } from "./ui/IUIManager";
import { IPanel } from "./ui/IPanel";

export class UIManager implements IUIManager {
  public createPanel(title: string): IPanel {
    const folder = this.pane.addFolder({ title });
    return folder as IPanel;
  }
  public registerComponentControls(
    componentName: string,
    data: any,
    properties?: ComponentControlProperty[]
  ): void {
    // Remove any existing controls for this component
    this.removeComponentControls(componentName);
    // Create a new folder for the component controls
    const folder = this.pane.addFolder({ title: componentName });
    this.folders.set(componentName, folder);
    // Add bindings for each property
    if (properties) {
      for (const prop of properties) {
        this._addBindingForProperty(folder, data, prop);
      }
    } else {
      // Auto-detect properties when not explicitly provided
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          const value = data[key];
          if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'string') {
            folder.addBinding(data, key, { label: key });
          }
        }
      }
    }
  }
  private pane: Pane;
  private folders: Map<string, FolderApi> = new Map();
  private eventBus: ApplicationEventBus;
  private propertyPreparer: typeof ComponentPropertyPreparer;

  constructor(
    pane: Pane,
    eventBus?: ApplicationEventBus,
    propertyPreparer?: typeof ComponentPropertyPreparer
  ) {
    this.pane = pane;
    this.eventBus = eventBus || new ApplicationEventBus();
    this.propertyPreparer = propertyPreparer || ComponentPropertyPreparer;
  }



  public addButton(panel: IPanel, title: string, onClick: () => void): void {
    (panel as FolderApi).addButton({ title }).on("click", onClick);
  }

  public addBinding(panel: IPanel, target: any, key: string, options: any): void {
    (panel as FolderApi).addBinding(target, key, options);
  }

  public refresh(): void {
    this.pane.refresh();
  }



  private _addBindingForProperty(
    folder: FolderApi,
    data: any,
    prop: ComponentControlProperty
  ): void {
    const options: {
      label: string;
      min?: number;
      max?: number;
      step?: number;
      format?: (v: any) => string;
    } = {
      label: prop.label,
      // Add a formatter to ensure consistent label width
      format: (v: any) => {
        if (typeof v === "number") {
          return v.toFixed(2);
        }
        return String(v);
      }
    };
    if (prop.min !== undefined) options.min = prop.min;
    if (prop.max !== undefined) options.max = prop.max;
    if (prop.step !== undefined) options.step = prop.step;

    let binding;
    if (prop.property.includes(".")) {
      // Handle nested properties of any depth
      const parts = prop.property.split(".");
      const lastKey = parts.pop()!; // Get the last part of the path
      const parentPath = parts.join("."); // Join the rest of the path
      const parentData = this._getNestedProperty(data, parentPath);

      if (parentData) {
        binding = folder.addBinding(parentData, lastKey, options);
      } else {
        Logger.getInstance().warn(
          `[UIManager] Could not find parent object for property: ${prop.property}`
        );
      }
    } else {
      binding = folder.addBinding(data, prop.property, options);
    }

    // Prevent parameter changes from triggering simulation to play
    // This ensures that only the play button can start the simulation
    if (binding) {
      binding.on("change", () => {
        // Force a render update without starting the simulation
        // This allows users to see the effect of parameter changes in the UI
        // without triggering the simulation to play
        const event = new CustomEvent("parameter-changed", {
          detail: { property: prop.property }
        });
        window.dispatchEvent(event);
      });
    } else {
      Logger.getInstance().warn(
        `[UIManager] Failed to create binding for property: ${prop.property}`
      );
    }
  }

  private _getNestedProperty(data: any, path: string): any {
    return path
      .split(".")
      .reduce(
        (obj, key) => (obj && obj[key] !== undefined ? obj[key] : undefined),
        data
      );
  }

  public clearControls(): void {
    this.folders.forEach((folder) => {
      folder.dispose();
    });
    this.folders.clear();
  }

  // Utility: get all registered component names
  public getRegisteredComponentNames(): string[] {
    return Array.from(this.folders.keys());
  }

  // Utility: remove a specific component's controls
  public removeComponentControls(componentName: string): void {
    const folder = this.folders.get(componentName);
    if (folder) {
      folder.dispose();
      this.folders.delete(componentName);
    }
  }

  // Future extensibility: allow switching UI frameworks
  // This method can be expanded to support other UI libraries
  public setUIPane(newPane: any): void {
    this.pane = newPane;
    this.clearControls(); // Clear old controls when switching UI
  }
}
