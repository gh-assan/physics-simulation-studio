// Mock the Tweakpane library
jest.mock('tweakpane', () => {
    const mockChildren = [];
    function makeFolder(options) {
        return {
            addBinding: jest.fn(() => ({ on: jest.fn() })),
            dispose: jest.fn(),
            options: options,
        };
    }
    const mockPane = {
        addFolder: jest.fn((options) => {
            const folder = makeFolder(options);
            mockChildren.push(folder);
            return folder;
        }),
        dispose: jest.fn(),
        children: mockChildren,
        remove: jest.fn((child) => {
            const index = mockChildren.indexOf(child);
            if (index > -1) {
                mockChildren.splice(index, 1);
            }
        }),
        addBinding: jest.fn(() => ({ on: jest.fn() })),
    };
    mockPane.children.forEach(folder => {
        folder.addBinding = jest.fn(() => ({ on: jest.fn() }));
    });
    return {
        Pane: jest.fn(() => mockPane),
    };
});

require('./testDomSetup');
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let PropertyInspectorSystem_1;
let components_1;
let uiManager_1;
let ecs_1;
let components_2;
describe('PropertyInspectorSystem', () => {
    let world;
    let uiManager;
    let propertyInspectorSystem;
    beforeEach(() => {
        jest.resetModules();
        PropertyInspectorSystem_1 = require("../systems/PropertyInspectorSystem");
        components_1 = require("@core/components");
        uiManager_1 = require("../uiManager");
        ecs_1 = require("@core/ecs");
        components_2 = require("@core/components");
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
        world = new ecs_1.World();
        // Minimal mock renderSystem for UIManager
        const mockRenderSystem = {
            renderer: { domElement: document.createElement('canvas'), setSize: jest.fn() },
            camera: { aspect: 1, updateProjectionMatrix: jest.fn() },
        };
        uiManager = new uiManager_1.UIManager(world, mockRenderSystem);
        propertyInspectorSystem = new PropertyInspectorSystem_1.PropertyInspectorSystem(uiManager);
        // Register components used in the test
        world.componentManager.registerComponent('SelectableComponent');
        world.componentManager.registerComponent('PositionComponent');
        // Spy on UIManager methods
        jest.spyOn(uiManager, 'clearControls');
        jest.spyOn(uiManager, 'registerComponentControls');
    });
    afterEach(() => {
        jest.restoreAllMocks();
        // Clean up injected DOM elements
        const ids = [
            'app-container', 'viewport-container', 'tweakpane-container', 'scene-graph-container',
            'play-button', 'pause-button', 'reset-button', 'add-box-button', 'add-sphere-button'
        ];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });
    });
    it('should select the first selectable entity and update the property inspector', () => {
        const entity1 = world.entityManager.createEntity();
        world.componentManager.addComponent(entity1, 'SelectableComponent', new components_1.SelectableComponent(true));
        world.componentManager.addComponent(entity1, 'PositionComponent', new components_2.PositionComponent(1, 2, 3));
        const entity2 = world.entityManager.createEntity();
        world.componentManager.addComponent(entity2, 'SelectableComponent', new components_1.SelectableComponent(false));
        propertyInspectorSystem.update(world, 0);
        expect(uiManager.clearControls).toHaveBeenCalledTimes(1);
        // Expect registerComponentControls to be called for the dummy component in PropertyInspectorSystem
        expect(uiManager.registerComponentControls).toHaveBeenCalledWith('SelectableComponent', expect.any(components_1.SelectableComponent));
        expect(uiManager.registerComponentControls).toHaveBeenCalledWith('PositionComponent', expect.any(components_2.PositionComponent));
    });
    it('should not update the property inspector if no selectable entities exist', () => {
        propertyInspectorSystem.update(world, 0);
        expect(uiManager.clearControls).not.toHaveBeenCalled();
        expect(uiManager.registerComponentControls).not.toHaveBeenCalled();
    });
});
