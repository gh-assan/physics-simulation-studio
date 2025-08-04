import { IComponent } from "./IComponent";

export interface IComponentRegistry {
  register<T extends IComponent>(componentClass: new (...args: any[]) => T): void;
  getConstructor(type: string): (new (...args: any[]) => IComponent) | undefined;
  createComponent<T extends IComponent>(type: string, ...args: any[]): T | undefined;
  getRegisteredTypes(): string[];
}
