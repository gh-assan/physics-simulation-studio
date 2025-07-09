import { ComponentManager } from '../../ecs/ComponentManager';
import { ComponentRegistry } from '../../ecs/ComponentRegistry';
import { Component } from '../../ecs/Component';

// Define test components
class TestComponent1 extends Component<TestComponent1> {
  static readonly type = 'TestComponent1';
  value: number;

  constructor(value = 0) {
    super();
    this.value = value;
  }

  clone(): TestComponent1 {
    return new TestComponent1(this.value);
  }
}

class TestComponent2 extends Component<TestComponent2> {
  static readonly type = 'TestComponent2';
  name: string;

  constructor(name = '') {
    super();
    this.name = name;
  }

  clone(): TestComponent2 {
    return new TestComponent2(this.name);
  }
}

// Test the ComponentManager
describe('ComponentManager', () => {
  let componentManager: ComponentManager;

  beforeEach(() => {
    // Clear the registry singleton between tests
    ComponentRegistry.getInstance().clear();
    componentManager = new ComponentManager();
    componentManager.registerComponent(TestComponent1);
    componentManager.registerComponent(TestComponent2);
  });

  test('should register components', () => {
    const constructors = componentManager.getComponentConstructors();
    expect(constructors.size).toBe(2);
    expect(constructors.has('TestComponent1')).toBe(true);
    expect(constructors.has('TestComponent2')).toBe(true);
  });

  test('should add and get components', () => {
    const entityId = 1;
    const component1 = new TestComponent1(42);
    const component2 = new TestComponent2('test');

    componentManager.addComponent(entityId, TestComponent1.type, component1);
    componentManager.addComponent(entityId, TestComponent2.type, component2);

    const retrievedComponent1 = componentManager.getComponent<TestComponent1>(entityId, TestComponent1.type);
    const retrievedComponent2 = componentManager.getComponent<TestComponent2>(entityId, TestComponent2.type);

    expect(retrievedComponent1).toBeDefined();
    expect(retrievedComponent1?.value).toBe(42);
    expect(retrievedComponent2).toBeDefined();
    expect(retrievedComponent2?.name).toBe('test');
  });

  test('should remove components', () => {
    const entityId = 1;
    const component = new TestComponent1(42);

    componentManager.addComponent(entityId, TestComponent1.type, component);
    expect(componentManager.hasComponent(entityId, TestComponent1.type)).toBe(true);

    componentManager.removeComponent(entityId, TestComponent1.type);
    expect(componentManager.hasComponent(entityId, TestComponent1.type)).toBe(false);
  });

  test('should get entities with components', () => {
    const entity1 = 1;
    const entity2 = 2;
    const entity3 = 3;

    componentManager.addComponent(entity1, TestComponent1.type, new TestComponent1());
    componentManager.addComponent(entity1, TestComponent2.type, new TestComponent2());
    componentManager.addComponent(entity2, TestComponent1.type, new TestComponent1());
    componentManager.addComponent(entity3, TestComponent2.type, new TestComponent2());

    const entitiesWithBoth = componentManager.getEntitiesWithComponents([TestComponent1, TestComponent2]);
    const entitiesWithComponent1 = componentManager.getEntitiesWithComponentTypes([TestComponent1.type]);
    const entitiesWithComponent2 = componentManager.getEntitiesWithComponentTypes([TestComponent2.type]);

    expect(entitiesWithBoth).toEqual([entity1]);
    expect(entitiesWithComponent1).toContain(entity1);
    expect(entitiesWithComponent1).toContain(entity2);
    expect(entitiesWithComponent2).toContain(entity1);
    expect(entitiesWithComponent2).toContain(entity3);
  });

  test('should perform batch operations', () => {
    const entities = [1, 2, 3];

    componentManager.batchOperation(entities, (entityId) => {
      componentManager.addComponent(entityId, TestComponent1.type, new TestComponent1(entityId));
    });

    for (const entityId of entities) {
      const component = componentManager.getComponent<TestComponent1>(entityId, TestComponent1.type);
      expect(component).toBeDefined();
      expect(component?.value).toBe(entityId);
    }
  });

  test('should add multiple components at once', () => {
    const entityId = 1;
    const components = {
      [TestComponent1.type]: new TestComponent1(42),
      [TestComponent2.type]: new TestComponent2('test')
    };

    componentManager.addComponents(entityId, components);

    expect(componentManager.hasComponent(entityId, TestComponent1.type)).toBe(true);
    expect(componentManager.hasComponent(entityId, TestComponent2.type)).toBe(true);
  });

  test('should create and add component', () => {
    const entityId = 1;

    const component = componentManager.createAndAddComponent<TestComponent1>(
      entityId,
      TestComponent1.type,
      42
    );

    expect(component).toBeDefined();
    expect(component.value).toBe(42);
    expect(componentManager.hasComponent(entityId, TestComponent1.type)).toBe(true);
  });
});
