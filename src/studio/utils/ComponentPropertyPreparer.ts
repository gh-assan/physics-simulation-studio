// Utility to prepare properties for UIManager rendering
// Filters out keys that should not be exposed in the UI

import { ComponentControlProperty } from "../types";

export class ComponentPropertyPreparer {
  static filterProperties(data: any): ComponentControlProperty[] {
    if (!data) return [];
    const excluded = ["particles", "springs", "fixedParticles"];
    return Object.keys(data)
      .filter((key) => !excluded.includes(key))
      .map((key) => {
        const value = data[key];
        const base: ComponentControlProperty = {
          property: key,
          label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()), // Human-readable label
          type: typeof value,
        };
        if (value && typeof value === "object") {
          if (typeof value.min === "number") base.min = value.min;
          if (typeof value.max === "number") base.max = value.max;
          if (typeof value.step === "number") base.step = value.step;
          if (Array.isArray(value.options)) base.options = value.options;
        }
        return base;
      });
  }
}
