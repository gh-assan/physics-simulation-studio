import { System } from "./System";
import { IComponent } from "./IComponent";
import { ISystemManager } from "./ISystemManager";

export interface IWorld {
  entityManager: IEntityManager;
  componentManager: IComponentManager;
  systemManager: ISystemManager;

  update(deltaTime: number): void;
  clear(clearSystems?: boolean): void;
  createEntity(id?: number): number;
  destroyEntity(entityId: number): void;
  registerComponent<T extends IComponent>(constructor: new (...args: any[]) => T): void;
  addComponent<T extends IComponent>(entityId: number, componentName: string, component: T): void;
  getComponent<T extends IComponent>(entityId: number, componentName: string): T | undefined;
  hasComponent(entityId: number, componentName: string): boolean;
  getEntitiesWithComponents(componentTypes: (new (...args: any[]) => IComponent)[]): number[];
  registerSystem(system: System): void;
  removeSystem(system: System): boolean;
}
