"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ComponentManager_1 = require("../ComponentManager");
class TestComponent {
    constructor(value) {
        this.value = value;
    }
}
describe('ComponentManager', () => {
    let componentManager;
    beforeEach(() => {
        componentManager = new ComponentManager_1.ComponentManager();
        componentManager.registerComponent('TestComponent');
    });
    it('should add and get a component', () => {
        const component = new TestComponent(42);
        componentManager.addComponent(0, 'TestComponent', component);
        const retrieved = componentManager.getComponent(0, 'TestComponent');
        expect(retrieved).toBe(component);
        expect(retrieved === null || retrieved === void 0 ? void 0 : retrieved.value).toBe(42);
    });
    it('should remove a component', () => {
        const component = new TestComponent(42);
        componentManager.addComponent(0, 'TestComponent', component);
        componentManager.removeComponent(0, 'TestComponent');
        const retrieved = componentManager.getComponent(0, 'TestComponent');
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
