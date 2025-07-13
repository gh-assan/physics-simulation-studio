import { Logger } from "../core/utils/Logger";
import { ApplicationEventBus } from "./utils/ApplicationEventBus";
import { ComponentPropertyPreparer } from "./utils/ComponentPropertyPreparer";
import { Pane, FolderApi } from "tweakpane";
import { ComponentControlProperty } from "./types";

export class UIManager {
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

  public addFolder(title: string, callback: (folder: FolderApi) => void): void {
    const folder = this.pane.addFolder({ title });
    callback(folder);
  }

  public refresh(): void {
    this.pane.refresh();
  }

  public registerComponentControls(
    componentName: string,
    data: any,
    properties?: ComponentControlProperty[]
  ) {
    const displayName = data.constructor
      ? `${data.constructor.name} (${componentName})`
      : componentName;
    Logger.log(`[UIManager] Registering controls for component: ${displayName}`);

    const folder = this.pane.addFolder({ title: displayName });
    this.folders.set(componentName, folder);

    // Use provided properties, or prepare them if not provided
    const props = properties || this.propertyPreparer.filterProperties(data);
    Logger.log(`[UIManager] Adding ${props.length} properties for ${displayName}`);
    props.forEach((prop) => {
      this._addBindingForProperty(folder, data, prop);
    });
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
        Logger.log(
          `[UIManager] Adding binding for nested property: ${prop.property}, parent: ${parentPath}, child: ${lastKey}`
        );
        binding = folder.addBinding(parentData, lastKey, options);
      } else {
        Logger.warn(
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
      Logger.warn(
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
}
