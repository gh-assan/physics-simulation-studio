import { IComponent } from './IComponent';

export interface IECSManager {
  createEntity(id?: number): number;
  destroyEntity(entityId: number): void;
  hasEntity(entityId: number): boolean;
  registerComponent<T extends IComponent>(componentClass: new (...args: any[]) => T): void;
  addComponent<T extends IComponent>(entityID: number, componentType: string, component: T): void;
  getComponent<T extends IComponent>(entityID: number, componentType: string): T | undefined;
  removeComponent(entityID: number, componentType: string): void;
  getEntitiesWithComponentTypes(componentTypes: string[]): number[];
  getAllComponentsForEntity(entityID: number): { [key: string]: IComponent; };
  updateComponent<T extends IComponent>(entityID: number, componentType: string, newComponent: T): void;
  clear(): void;
  getComponentConstructors(): Map<string, new (...args: any[]) => IComponent>;
}
