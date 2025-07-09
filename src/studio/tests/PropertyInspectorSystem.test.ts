import './testDomSetup';

import { PropertyInspectorSystem } from '../systems/PropertyInspectorSystem';
import { SelectableComponent } from '@core/components';
import { UIManager } from '../uiManager';
import { World } from '@core/ecs';
import { PositionComponent } from '@core/components';
import { Pane } from 'tweakpane';

// Mock the Tweakpane library (same as in UIManager.test.ts)
jest.mock('tweakpane', () => {
    function makeFolder(options: any) {
        return {
            addBinding: jest.fn(() => ({ on: jest.fn() })),
            dispose: jest.fn(),
            options: options,
        };
    }
    const mockPane = {
        addFolder: jest.fn((options: any) => makeFolder(options)),
        dispose: jest.fn(),
        addBinding: jest.fn(() => ({ on: jest.fn() })),
    };
    return {
        Pane: jest.fn(() => mockPane),
    };
});

describe('PropertyInspectorSystem', () => {
    let world: World;
    let uiManager: UIManager;
    let propertyInspectorSystem: PropertyInspectorSystem;
    let mockPaneInstance: any; // To hold the mocked Pane instance

    beforeEach(() => {
        // Create required DOM elements
        const ids = [
            'app-container', 'viewport-container', 'tweakpane-container', 'scene-graph-container',
            'play-button', 'pause-button', 'reset-button', 'add-box-button', 'add-sphere-button'
        ];
        ids.forEach(id => {
            const el = document.createElement(id.endsWith('-button') ? 'button' : 'div');
            el.id = id;
            document.body.appendChild(el);
        });

        world = new World();
        mockPaneInstance = (Pane as jest.Mock).mock.results[0]?.value || new (Pane as any)();
        uiManager = new UIManager(mockPaneInstance);
        propertyInspectorSystem = new PropertyInspectorSystem(uiManager);

        // Register components used in the test
        world.componentManager.registerComponent(SelectableComponent.name, SelectableComponent);
        world.componentManager.registerComponent(PositionComponent.name, PositionComponent);

        // Spy on UIManager methods
        jest.spyOn(uiManager, 'registerComponentControls');
        jest.spyOn(mockPaneInstance, 'dispose'); // Spy on the dispose method of the mocked Pane instance
    });

    afterEach(() => {
        // Clean up injected DOM elements
        const ids = [
            'app-container', 'viewport-container', 'tweakpane-container', 'scene-graph-container',
            'play-button', 'pause-button', 'reset-button', 'add-box-button', 'add-sphere-button'
        ];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });

        jest.restoreAllMocks();
    });

    it('should select the first selectable entity and update the property inspector', () => {
        const entity1 = world.entityManager.createEntity();
        world.componentManager.addComponent(entity1, SelectableComponent.name, new SelectableComponent(true));
        world.componentManager.addComponent(entity1, PositionComponent.name, new PositionComponent(1, 2, 3));

        const entity2 = world.entityManager.createEntity();
        world.componentManager.addComponent(entity2, SelectableComponent.name, new SelectableComponent(false));

        propertyInspectorSystem.update(world, 0);

        // Only check the main UIManager effect, not Pane disposal
        expect(uiManager.registerComponentControls).toHaveBeenCalledWith(SelectableComponent.name, expect.any(SelectableComponent));
        expect(uiManager.registerComponentControls).toHaveBeenCalledWith(PositionComponent.name, expect.any(PositionComponent));
    });

    it('should not update the property inspector if no selectable entities exist', () => {
        propertyInspectorSystem.update(world, 0);
        expect(uiManager.registerComponentControls).not.toHaveBeenCalled();
    });
});