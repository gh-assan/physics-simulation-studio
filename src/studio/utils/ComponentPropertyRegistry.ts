import { ComponentControlProperty, ComponentPropertyMap } from "../types";
import { IComponentPropertyRegistry } from "./IComponentPropertyRegistry";
import { Logger } from "../../core/utils/Logger";

export class ComponentPropertyRegistry implements IComponentPropertyRegistry {
  private static instance: ComponentPropertyRegistry;
  private registry: ComponentPropertyMap = {};

  private constructor() {}

  public static getInstance(): ComponentPropertyRegistry {
    if (!ComponentPropertyRegistry.instance) {
      ComponentPropertyRegistry.instance = new ComponentPropertyRegistry();
    }
    return ComponentPropertyRegistry.instance;
  }

  public registerComponentProperties(
    componentName: string,
    properties: ComponentControlProperty[]
  ): void {
    Logger.getInstance().log(
      `[ComponentPropertyRegistry] Registered properties for '${componentName}'.`
    );
    this.registry[componentName] = properties;
  }

  public getComponentProperties(
    componentName: string
  ): ComponentControlProperty[] | undefined {
    const properties = this.registry[componentName];
    if (properties) {
      Logger.getInstance().log(
        `[ComponentPropertyRegistry] Retrieved properties for '${componentName}'.`
      );
    } else {
      Logger.getInstance().warn(
        `[ComponentPropertyRegistry] No properties found for '${componentName}'.`
      );
    }
    return properties;
  }
}

