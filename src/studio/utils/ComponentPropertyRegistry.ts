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

    const logMessage = properties
      ? `Retrieved properties for '${componentName}'.`
      : `No properties found for '${componentName}'.`;

    const logMethod = properties ? Logger.getInstance().log : Logger.getInstance().warn;
    logMethod.call(Logger.getInstance(), `[ComponentPropertyRegistry] ${logMessage}`);

    return properties;
  }
}

