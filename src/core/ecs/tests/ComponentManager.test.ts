import { ComponentManager } from '../ComponentManager';
import { IComponent } from '../IComponent';

class TestComponent implements IComponent {
    constructor(public value: number) {}
}

describe('ComponentManager', () => {
    let componentManager: ComponentManager;

    beforeEach(() => {
        componentManager = new ComponentManager();
        componentManager.registerComponent('TestComponent');
    });

    it('should add and get a component', () => {
        const component = new TestComponent(42);
        componentManager.addComponent(0, 'TestComponent', component);
        const retrieved = componentManager.getComponent<TestComponent>(0, 'TestComponent');
        expect(retrieved).toBe(component);
        expect(retrieved?.value).toBe(42);
    });

    it('should remove a component', () => {
        const component = new TestComponent(42);
        componentManager.addComponent(0, 'TestComponent', component);
        componentManager.removeComponent(0, 'TestComponent');
        const retrieved = componentManager.getComponent<TestComponent>(0, 'TestComponent');
        expect(retrieved).toBeUndefined();
    });

    it('should get entities with components', () => {
        componentManager.registerComponent('AnotherComponent');
        componentManager.addComponent(0, 'TestComponent', new TestComponent(1));
        componentManager.addComponent(1, 'TestComponent', new TestComponent(2));
        componentManager.addComponent(1, 'AnotherComponent', {});
        componentManager.addComponent(2, 'TestComponent', new TestComponent(3));

        const entities = componentManager.getEntitiesWithComponents(['TestComponent', 'AnotherComponent']);
        expect(entities).toEqual([1]);
    });
});
