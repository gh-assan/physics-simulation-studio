import { ComponentControlProperty } from "../types";

export function prepareComponentProperties(
  data: any,
  properties?: ComponentControlProperty[]
): ComponentControlProperty[] {
  if (properties) {
    return properties;
  }

  const defaultProperties: ComponentControlProperty[] = [];
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      if (
        key !== "particles" &&
        key !== "springs" &&
        key !== "fixedParticles"
      ) {
        defaultProperties.push({ property: key, label: key, type: 'binding' });
      }
    }
  }
  return defaultProperties;
}
