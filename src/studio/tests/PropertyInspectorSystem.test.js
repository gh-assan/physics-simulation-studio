"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./testDomSetup");
const PropertyInspectorSystem_1 = require("../systems/PropertyInspectorSystem");
const components_1 = require("@core/components");
const uiManager_1 = require("../uiManager");
const ecs_1 = require("@core/ecs");
const components_2 = require("@core/components");

describe('PropertyInspectorSystem', () => {
    let world;
    let uiManager;
    let propertyInspectorSystem;
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
        // Clean up injected DOM elements
        const ids = [
            'app-container', 'viewport-container', 'tweakpane-container', 'scene-graph-container',
            'play-button', 'pause-button', 'reset-button', 'add-box-button', 'add-sphere-button'
        ];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el)
                el.remove();
        });
        jest.restoreAllMocks();
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
