import { StudioUIManager } from '../uiManager';
import { Pane, FolderApi } from 'tweakpane';

// Mock the Tweakpane library
jest.mock('tweakpane', () => {
    const mockPane = {
        addFolder: jest.fn(() => ({
            addBinding: jest.fn(),
            dispose: jest.fn(),
        })),
        dispose: jest.fn(),
    };
    return {
        Pane: jest.fn(() => mockPane),
    };
});

describe('StudioUIManager', () => {
    let uiManager: StudioUIManager;
    let mockPaneInstance: any; // This will hold the mocked Pane instance

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();

        // Mock the DOM element before creating UIManager instance
        document.body.innerHTML = '<div id="tweakpane-container"></div>';

        uiManager = new StudioUIManager();
        // Get the mock Pane instance created by the UIManager constructor
        mockPaneInstance = (Pane as jest.Mock).mock.results[0]?.value;
    });

    it('should initialize Tweakpane and append to container', () => {
        expect(Pane).toHaveBeenCalledTimes(1);
        expect(Pane).toHaveBeenCalledWith(expect.objectContaining({
            container: document.getElementById('tweakpane-container'),
        }));
    });

    it('should register component controls for numbers and booleans', () => {
        const obj = {
            value: 10,
            enabled: true,
            name: "test",
        };
        uiManager.registerComponentControls('TestComponent', obj);

        expect(mockPaneInstance.addFolder).toHaveBeenCalledWith({ title: 'TestComponent' });
        const mockFolder = mockPaneInstance.addFolder.mock.results[0]?.value;
        expect(mockFolder.addBinding).toHaveBeenCalledWith(obj, 'value');
        expect(mockFolder.addBinding).toHaveBeenCalledWith(obj, 'enabled');
        expect(mockFolder.addBinding).not.toHaveBeenCalledWith(obj, 'name');
    });

    it('should clear all controls', () => {
        // Register some dummy components to create folders
        const mockObj1 = { prop1: 1 };
        const mockObj2 = { prop2: true };
        uiManager.registerComponentControls('ComponentA', mockObj1);
        uiManager.registerComponentControls('ComponentB', mockObj2);

        // Get the mock folder instances that were returned by addFolder
        const mockFolderA = mockPaneInstance.addFolder.mock.results[0]?.value;
        const mockFolderB = mockPaneInstance.addFolder.mock.results[1]?.value;

        // Ensure dispose was not called initially
        expect(mockFolderA.dispose).not.toHaveBeenCalled();
        expect(mockFolderB.dispose).not.toHaveBeenCalled();

        uiManager.clearControls();

        // Expect dispose to have been called on each mock folder
        expect(mockFolderA.dispose).toHaveBeenCalledTimes(1);
        expect(mockFolderB.dispose).toHaveBeenCalledTimes(1);
    });
});
