"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./testDomSetup");
const uiManager_1 = require("../uiManager");
const tweakpane_1 = require("tweakpane");
// Mock the Tweakpane library
jest.mock('tweakpane', () => {
    const mockChildren = [];
    const mockPane = {
        addFolder: jest.fn((options) => {
            const folder = {
                addBinding: jest.fn(() => ({
                    on: jest.fn(),
                })),
                dispose: jest.fn(),
                options: options,
            };
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
    };
    return {
        Pane: jest.fn(() => mockPane),
    };
});
describe('UIManager', () => {
    let uiManager;
    let mockPaneInstance; // This will hold the mocked Pane instance
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
        uiManager = new uiManager_1.UIManager();
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
    });
    it('should initialize Tweakpane', () => {
        expect(tweakpane_1.Pane).toHaveBeenCalledTimes(1);
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
        expect(mockFolder.addBinding).toHaveBeenCalledWith(obj, 'value');
        expect(mockFolder.addBinding).toHaveBeenCalledWith(obj, 'enabled');
        expect(mockFolder.addBinding).toHaveBeenCalledWith(obj, 'name');
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
        expect(tweakpane_1.Pane).toHaveBeenCalledTimes(2); // Pane should be re-initialized
    });
});
