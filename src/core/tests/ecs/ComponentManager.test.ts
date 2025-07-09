import { ComponentManager } from "../../ecs/ComponentManager";
import { IComponent } from "../../ecs/IComponent";

class TestComponent implements IComponent {
  static readonly type = "TestComponent";

  constructor(public value: number) {}

  clone(): TestComponent {
    return new TestComponent(this.value);
  }
}

class AnotherComponent implements IComponent {
  static readonly type = "AnotherComponent";

  constructor(public name: string) {}

  clone(): AnotherComponent {
    return new AnotherComponent(this.name);
  }
}

describe("ComponentManager", () => {
  let componentManager: ComponentManager;

  beforeEach(() => {
    componentManager = new ComponentManager();
    componentManager.registerComponent(TestComponent);
    componentManager.registerComponent(AnotherComponent);
  });

  it("should add and get a component", () => {
    const component = new TestComponent(42);
    componentManager.addComponent(0, TestComponent.type, component);
    const retrieved = componentManager.getComponent<TestComponent>(
      0,
      TestComponent.type
    );
    expect(retrieved).toBe(component);
    expect(retrieved?.value).toBe(42);
  });

  it("should remove a component", () => {
    const component = new TestComponent(42);
    componentManager.addComponent(0, TestComponent.type, component);
    componentManager.removeComponent(0, TestComponent.type);
    const retrieved = componentManager.getComponent<TestComponent>(
      0,
      TestComponent.type
    );
    expect(retrieved).toBeUndefined();
  });

  it("should get entities with components", () => {
    componentManager.addComponent(0, TestComponent.type, new TestComponent(1));
    componentManager.addComponent(1, TestComponent.type, new TestComponent(2));
    componentManager.addComponent(
      1,
      AnotherComponent.type,
      new AnotherComponent("test")
    );
    componentManager.addComponent(2, TestComponent.type, new TestComponent(3));

    const entities = componentManager.getEntitiesWithComponents([
      TestComponent,
      AnotherComponent
    ]);
    expect(entities).toEqual([1]);
  });

  it("should clear all components", () => {
    componentManager.addComponent(0, TestComponent.type, new TestComponent(1));
    componentManager.addComponent(
      1,
      AnotherComponent.type,
      new AnotherComponent("test")
    );
    expect(
      componentManager.getAllComponentsForEntity(0)[TestComponent.type]
    ).toBeDefined();
    expect(
      componentManager.getAllComponentsForEntity(1)[AnotherComponent.type]
    ).toBeDefined();

    componentManager.clear();

    expect(
      componentManager.getAllComponentsForEntity(0)[TestComponent.type]
    ).toBeUndefined();
    expect(
      componentManager.getAllComponentsForEntity(1)[AnotherComponent.type]
    ).toBeUndefined();
  });
});
