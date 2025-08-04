import { IComponent } from "./IComponent";
import { IWorld } from "./IWorld";

export interface IComponentManager {
  registerComponent<T extends IComponent>(componentClass: new (...args: any[]) => T): void;
  addComponent<T extends IComponent>(entityID: number, componentType: string, component: T): void;
  getComponent<T extends IComponent>(entityID: number, componentType: string): T | undefined;
  removeComponent(entityID: number, componentType: string, world?: IWorld): void;
  getEntitiesWithComponentTypes(componentTypes: string[]): number[];
  getEntitiesWithComponents(componentClasses: (new (...args: any[]) => IComponent)[]): number[];
  getAllComponentsForEntity(entityID: number): { [key: string]: IComponent; };
  updateComponent<T extends IComponent>(entityID: number, componentType: string, newComponent: T): void;
  hasComponent(entityID: number, componentType: string): boolean;
  clear(): void;
  getComponentConstructors(): Map<string, new (...args: any[]) => IComponent>;
}
