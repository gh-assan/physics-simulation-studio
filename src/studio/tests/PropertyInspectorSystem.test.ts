import { PropertyInspectorSystem } from '../systems/PropertyInspectorSystem';
import { SelectableComponent } from '@core/components';
import { StudioUIManager } from '../uiManager';
import { World } from '@core/ecs';
import { PositionComponent } from '@core/components';

describe('PropertyInspectorSystem', () => {
    let world: World;
    let uiManager: StudioUIManager;
    let propertyInspectorSystem: PropertyInspectorSystem;

    beforeEach(() => {
        // Mock the DOM element for Tweakpane container
        document.body.innerHTML = '<div id="tweakpane-container"></div>';

        world = new World();
        uiManager = new StudioUIManager();
        propertyInspectorSystem = new PropertyInspectorSystem(uiManager);

        // Register components used in the test
        world.componentManager.registerComponent('SelectableComponent');
        world.componentManager.registerComponent('PositionComponent');

        // Spy on UIManager methods
        jest.spyOn(uiManager, 'clearControls');
        jest.spyOn(uiManager, 'registerComponentControls');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should select the first selectable entity and update the property inspector', () => {
        const entity1 = world.entityManager.createEntity();
        world.componentManager.addComponent(entity1, 'SelectableComponent', new SelectableComponent(true));
        world.componentManager.addComponent(entity1, 'PositionComponent', new PositionComponent(1, 2, 3));

        const entity2 = world.entityManager.createEntity();
        world.componentManager.addComponent(entity2, 'SelectableComponent', new SelectableComponent(false));

        propertyInspectorSystem.update(world, 0);

        expect(uiManager.clearControls).toHaveBeenCalledTimes(1);
        // Expect registerComponentControls to be called for the dummy component in PropertyInspectorSystem
        expect(uiManager.registerComponentControls).toHaveBeenCalledWith('SelectableComponent', expect.any(SelectableComponent));
        expect(uiManager.registerComponentControls).toHaveBeenCalledWith('PositionComponent', expect.any(PositionComponent));
    });

    it('should not update the property inspector if no selectable entities exist', () => {
        propertyInspectorSystem.update(world, 0);
        expect(uiManager.clearControls).not.toHaveBeenCalled();
        expect(uiManager.registerComponentControls).not.toHaveBeenCalled();
    });
});