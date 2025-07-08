"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./testDomSetup");
const uiManager_1 = require("../uiManager");
const tweakpane_1 = require("tweakpane");

describe('UIManager', () => {
    let uiManager;
    let mockPaneInstance; // This will hold the mocked Pane instance
    let mockWorld;
    let mockRenderSystem;
    beforeEach(() => {
        var _a;
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
        // Clear all mocks before each test
        jest.clearAllMocks();
        mockWorld = {
            entityManager: {
                createEntity: jest.fn(() => 1),
                getEntitiesWithComponents: jest.fn(() => []),
            },
            componentManager: {
                addComponent: jest.fn(),
                getComponent: jest.fn(),
                getAllComponentsForEntity: jest.fn(() => ({})),
                updateComponent: jest.fn(),
            },
        };
        mockRenderSystem = {
            renderer: {
                domElement: document.createElement('canvas'),
                setSize: jest.fn(),
            },
            camera: {
                aspect: 1,
                updateProjectionMatrix: jest.fn(),
            },
            raycaster: {
                setFromCamera: jest.fn(),
                intersectObjects: jest.fn(() => []),
            },
            scene: {
                children: [],
            },
            physicsWorld: {
                createRigidBody: jest.fn(() => ({
                    translation: jest.fn(() => ({ x: 0, y: 0, z: 0 })),
                    rotation: jest.fn(() => ({ x: 0, y: 0, z: 0, w: 1 })),
                })),
                createCollider: jest.fn(),
            },
            addMesh: jest.fn(),
            getEntityIdFromMesh: jest.fn(),
        };
        uiManager = new uiManager_1.UIManager(mockWorld, mockRenderSystem);
        // Get the mock Pane instance created by the UIManager constructor
        mockPaneInstance = (_a = tweakpane_1.Pane.mock.results[0]) === null || _a === void 0 ? void 0 : _a.value;
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
        // Clean up any remaining folders in the mock Pane instance
        mockPaneInstance.children.forEach((folder) => folder.dispose());
    });
    it('should initialize Tweakpane and append to container', () => {
        expect(tweakpane_1.Pane).toHaveBeenCalledTimes(1);
        expect(tweakpane_1.Pane).toHaveBeenCalledWith(expect.objectContaining({
            container: document.getElementById('tweakpane-container'),
        }));
    });
    it('should register component controls for numbers, booleans, and strings', () => {
        var _a;
        const obj = {
            value: 10,
            enabled: true,
            name: "test",
        };
        uiManager.registerComponentControls('TestComponent', obj);
        expect(mockPaneInstance.addFolder).toHaveBeenCalledWith({ title: 'TestComponent' });
        const mockFolder = (_a = mockPaneInstance.addFolder.mock.results[0]) === null || _a === void 0 ? void 0 : _a.value;
        expect(mockFolder.addBinding).toHaveBeenCalledWith(obj, 'value', expect.any(Object));
        expect(mockFolder.addBinding).toHaveBeenCalledWith(obj, 'enabled', expect.any(Object));
        expect(mockFolder.addBinding).toHaveBeenCalledWith(obj, 'name', expect.any(Object));
    });
    it('should clear all controls', () => {
        // Register some dummy components to create folders
        const mockObj1 = { prop1: 1 };
        const mockObj2 = { prop2: true };
        uiManager.registerComponentControls('ComponentA', mockObj1);
        uiManager.registerComponentControls('ComponentB', mockObj2);
        // Expect pane.dispose to have been called
        const disposeSpy = jest.spyOn(mockPaneInstance, 'dispose');
        uiManager.clearControls();
        expect(disposeSpy).toHaveBeenCalled();
    });
});
