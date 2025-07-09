import { Pane, FolderApi } from "tweakpane";
import { ComponentControlProperty } from "./types";

export class UIManager {
  private pane: Pane;
  private folders: Map<string, FolderApi> = new Map();

  constructor(pane: Pane) {
    this.pane = pane;
  }

  public registerComponentControls(
    componentName: string,
    data: any,
    properties?: ComponentControlProperty[]
  ) {
    const folder = this.pane.addFolder({ title: componentName });
    this.folders.set(componentName, folder);

    if (properties) {
      properties.forEach((prop) => {
        this._addBindingForProperty(folder, data, prop);
      });
    } else {
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
    } = { label: prop.label };
    if (prop.min !== undefined) options.min = prop.min;
    if (prop.max !== undefined) options.max = prop.max;
    if (prop.step !== undefined) options.step = prop.step;

    let binding;
    if (prop.property.includes(".")) {
      const [parentKey, childKey] = prop.property.split(".");
      const parentData = this._getNestedProperty(data, parentKey);
      if (parentData) {
        binding = folder.addBinding(parentData, childKey, options);
      }
    } else {
      binding = folder.addBinding(data, prop.property, options);
    }

    // Prevent parameter changes from triggering simulation to play
    // This ensures that only the play button can start the simulation
    if (binding) {
      binding.on('change', () => {
        // Force a render update without starting the simulation
        // This allows users to see the effect of parameter changes in the UI
        // without triggering the simulation to play
        const event = new CustomEvent('parameter-changed', { detail: { property: prop.property } });
        window.dispatchEvent(event);
      });
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
