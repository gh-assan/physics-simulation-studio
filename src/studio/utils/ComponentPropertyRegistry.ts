// src/studio/utils/ComponentPropertyRegistry.ts

import { ComponentControlProperty, ComponentPropertyMap } from "../types";

const componentPropertyRegistry: ComponentPropertyMap = {};

export function registerComponentProperties(
  componentName: string,
  properties: ComponentControlProperty[]
): void {
  console.log(
    `[ComponentPropertyRegistry] Registering properties for component: '${componentName}'`,
    properties
  );
  componentPropertyRegistry[componentName] = properties;
}

export function getComponentProperties(
  componentName: string
): ComponentControlProperty[] | undefined {
  const properties = componentPropertyRegistry[componentName];
  if (properties) {
    console.log(
      `[ComponentPropertyRegistry] Retrieving properties for component: '${componentName}'`,
      properties
    );
  } else {
    console.warn(
      `[ComponentPropertyRegistry] No properties found for component: '${componentName}'`
    );
  }
  return properties;
}
