import { Pane, FolderApi } from "tweakpane";
import { ComponentControlProperty } from "./types";

export class UIManager {
  private pane: Pane;
  private folders: Map<string, FolderApi> = new Map();

  constructor(pane: Pane) {
    this.pane = pane;
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
    // Use the component's constructor name if available, otherwise use the provided name
    const displayName = data.constructor
      ? `${data.constructor.name} (${componentName})`
      : componentName;
    console.log(
      `[UIManager] Registering controls for component: ${displayName}`
    );

    const folder = this.pane.addFolder({ title: displayName });
    this.folders.set(componentName, folder);

    if (properties) {
      console.log(
        `[UIManager] Adding ${properties.length} properties for ${displayName}`
      );
      properties.forEach((prop) => {
        this._addBindingForProperty(folder, data, prop);
      });
    } else {
      console.log(
        `[UIManager] No properties provided for ${displayName}, using default properties`
      );
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          if (
            key !== "particles" &&
            key !== "springs" &&
            key !== "fixedParticles"
          ) {
            folder.addBinding(data, key);
          }
        }
      }
    }
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
        console.log(
          `[UIManager] Adding binding for nested property: ${prop.property}, parent: ${parentPath}, child: ${lastKey}`
        );
        binding = folder.addBinding(parentData, lastKey, options);
      } else {
        console.warn(
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
      console.warn(
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
