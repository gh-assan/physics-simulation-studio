import { ComponentManager } from "../ComponentManager";
import { IComponent } from "../IComponent";

class TestComponent implements IComponent {
  constructor(public value: number) {}

  clone(): TestComponent {
    return new TestComponent(this.value);
  }
}

class AnotherComponent implements IComponent {
  constructor(public name: string) {}

  clone(): AnotherComponent {
    return new AnotherComponent(this.name);
  }
}

describe("ComponentManager", () => {
  let componentManager: ComponentManager;

  beforeEach(() => {
    componentManager = new ComponentManager();
    componentManager.registerComponent(TestComponent.name, TestComponent);
    componentManager.registerComponent(AnotherComponent.name, AnotherComponent);
  });

  it("should add and get a component", () => {
    const component = new TestComponent(42);
    componentManager.addComponent(0, TestComponent.name, component);
    const retrieved = componentManager.getComponent<TestComponent>(
      0,
      TestComponent.name
    );
    expect(retrieved).toBe(component);
    expect(retrieved?.value).toBe(42);
  });

  it("should remove a component", () => {
    const component = new TestComponent(42);
    componentManager.addComponent(0, TestComponent.name, component);
    componentManager.removeComponent(0, TestComponent.name);
    const retrieved = componentManager.getComponent<TestComponent>(
      0,
      TestComponent.name
    );
    expect(retrieved).toBeUndefined();
  });

  it("should get entities with components", () => {
    componentManager.addComponent(0, TestComponent.name, new TestComponent(1));
    componentManager.addComponent(1, TestComponent.name, new TestComponent(2));
    componentManager.addComponent(
      1,
      AnotherComponent.name,
      new AnotherComponent("test")
    );
    componentManager.addComponent(2, TestComponent.name, new TestComponent(3));

    const entities = componentManager.getEntitiesWithComponents([
      TestComponent,
      AnotherComponent
    ]);
    expect(entities).toEqual([1]);
  });

  it("should clear all components", () => {
    componentManager.addComponent(0, TestComponent.name, new TestComponent(1));
    componentManager.addComponent(
      1,
      AnotherComponent.name,
      new AnotherComponent("test")
    );
    expect(
      componentManager.getAllComponentsForEntity(0)[TestComponent.name]
    ).toBeDefined();
    expect(
      componentManager.getAllComponentsForEntity(1)[AnotherComponent.name]
    ).toBeDefined();

    componentManager.clear();

    expect(
      componentManager.getAllComponentsForEntity(0)[TestComponent.name]
    ).toBeUndefined();
    expect(
      componentManager.getAllComponentsForEntity(1)[AnotherComponent.name]
    ).toBeUndefined();
  });
});
