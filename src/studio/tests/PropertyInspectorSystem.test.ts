import './testDomSetup';

import { PropertyInspectorSystem } from '../systems/PropertyInspectorSystem';
import { SelectableComponent } from '@core/components';
import { UIManager } from '../uiManager';
import { World } from '@core/ecs';
import { PositionComponent } from '@core/components';

// Mock the Tweakpane library (same as in UIManager.test.ts)
jest.mock('tweakpane', () => {
    const mockChildren: any[] = [];
    function makeFolder(options: any) {
        // Each folder gets its own addBinding mock that always returns { on: jest.fn() }
        return {
            addBinding: jest.fn(() => ({ on: jest.fn() })),
            dispose: jest.fn(),
            options: options,
        };
    }
    const mockPane = {
        addFolder: jest.fn((options: any) => {
            const folder = makeFolder(options);
            mockChildren.push(folder);
            return folder;
        }),
        dispose: jest.fn(),
        children: mockChildren,
        remove: jest.fn((child: any) => {
            const index = mockChildren.indexOf(child);
            if (index > -1) {
                mockChildren.splice(index, 1);
            }
        }),
        // Ensure addBinding always returns { on: jest.fn() } for the pane itself
        addBinding: jest.fn(() => ({ on: jest.fn() })),
    };
    // Defensive: ensure all folders in children always have addBinding returning { on: jest.fn() }
    mockPane.children.forEach(folder => {
        folder.addBinding = jest.fn(() => ({ on: jest.fn() }));
    });
    return {
        Pane: jest.fn(() => mockPane),
    };
});

describe('PropertyInspectorSystem', () => {
    let world: World;
    let uiManager: UIManager;
    let propertyInspectorSystem: PropertyInspectorSystem;

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
        // Minimal mock renderSystem for UIManager
        const mockRenderSystem = {
            renderer: { domElement: document.createElement('canvas'), setSize: jest.fn() },
            camera: { aspect: 1, updateProjectionMatrix: jest.fn() },
        };
        uiManager = new UIManager(world, mockRenderSystem as any);
        propertyInspectorSystem = new PropertyInspectorSystem(uiManager);

        // Register components used in the test
        world.componentManager.registerComponent('SelectableComponent');
        world.componentManager.registerComponent('PositionComponent');

        // Spy on UIManager methods
        jest.spyOn(uiManager, 'clearControls' as any);
        jest.spyOn(uiManager, 'registerComponentControls' as any);
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