import { VisibilityManager } from '../VisibilityManager';

describe('VisibilityManager - Parameter Panels', () => {
  let visibilityManager: VisibilityManager;
  let container: HTMLElement;
  let globalContainer: HTMLElement;
  let pluginContainer: HTMLElement;

  beforeEach(() => {
    visibilityManager = new VisibilityManager();

    // Create test containers
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);

    globalContainer = document.createElement('div');
    globalContainer.id = 'global-panel-container';
    document.body.appendChild(globalContainer);

    pluginContainer = document.createElement('div');
    pluginContainer.id = 'plugin-panel-container';
    document.body.appendChild(pluginContainer);
  });

  afterEach(() => {
    visibilityManager.destroy();
    document.body.removeChild(container);
    document.body.removeChild(globalContainer);
    document.body.removeChild(pluginContainer);
  });

  describe('Global Panel Management', () => {
    it('should register global panels with proper metadata', () => {
      const mockTweakpaneFolder = {
        element: document.createElement('div'),
        title: 'Global Controls'
      };

      const success = visibilityManager.registerGlobalPanel(
        'global-controls',
        mockTweakpaneFolder,
        globalContainer,
        { isGlobalControl: true, priority: 1 }
      );

      expect(success).toBe(true);
      expect(visibilityManager.isPanelVisible('global-controls')).toBe(true);

      const globalPanels = visibilityManager.getPanelsByType('global');
      expect(globalPanels.size).toBe(1);
      expect(globalPanels.has('global-controls')).toBe(true);

      const panel = globalPanels.get('global-controls');
      expect(panel?.metadata?.isGlobalControl).toBe(true);
      expect(panel?.metadata?.priority).toBe(1);
      expect(panel?.metadata?.tweakpaneFolder).toBe(mockTweakpaneFolder);
    });

    it('should register simulation selector as global panel', () => {
      const mockSimulationFolder = {
        element: document.createElement('div'),
        title: 'Simulations'
      };

      const success = visibilityManager.registerGlobalPanel(
        'simulation-selector',
        mockSimulationFolder,
        globalContainer,
        { isSimulationSelector: true, priority: 2 }
      );

      expect(success).toBe(true);

      const panel = visibilityManager.getPanelsByType('global').get('simulation-selector');
      expect(panel?.metadata?.isSimulationSelector).toBe(true);
      expect(panel?.metadata?.priority).toBe(2);
    });

    it('should show/hide all global panels', () => {
      // Register multiple global panels
      const controlsFolder = { element: document.createElement('div') };
      const simulationFolder = { element: document.createElement('div') };

      visibilityManager.registerGlobalPanel('global-controls', controlsFolder, globalContainer);
      visibilityManager.registerGlobalPanel('simulation-selector', simulationFolder, globalContainer);

      // Hide all global panels
      visibilityManager.hideAllGlobalPanels();
      expect(visibilityManager.isPanelVisible('global-controls')).toBe(false);
      expect(visibilityManager.isPanelVisible('simulation-selector')).toBe(false);

      // Show all global panels
      visibilityManager.showAllGlobalPanels();
      expect(visibilityManager.isPanelVisible('global-controls')).toBe(true);
      expect(visibilityManager.isPanelVisible('simulation-selector')).toBe(true);
    });

    it('should emit globalPanelToggled events', () => {
      const onGlobalToggle = jest.fn();
      visibilityManager.on('globalPanelToggled', onGlobalToggle);

      const folder = { element: document.createElement('div') };
      visibilityManager.registerGlobalPanel('global-controls', folder, globalContainer);

      // Toggle should emit event
      visibilityManager.hidePanel('global-controls');
      expect(onGlobalToggle).toHaveBeenCalledWith({
        panelId: 'global-controls',
        visible: false,
        element: folder.element,
        type: 'global',
        metadata: expect.objectContaining({ tweakpaneFolder: folder })
      });

      visibilityManager.showPanel('global-controls');
      expect(onGlobalToggle).toHaveBeenCalledWith({
        panelId: 'global-controls',
        visible: true,
        element: folder.element,
        type: 'global',
        metadata: expect.objectContaining({ tweakpaneFolder: folder })
      });
    });
  });

  describe('Plugin Panel Management', () => {
    it('should register plugin panels with proper metadata', () => {
      const mockParameterPanel = {
        componentType: 'FlagComponent',
        registerControls: jest.fn(),
        updateControls: jest.fn(),
        handleEvent: jest.fn()
      };

      const success = visibilityManager.registerPluginPanel(
        'flag-parameter-panel',
        mockParameterPanel,
        pluginContainer,
        { pluginName: 'flag-simulation', componentType: 'FlagComponent', priority: 10 }
      );

      expect(success).toBe(true);
      expect(visibilityManager.isPanelVisible('flag-parameter-panel')).toBe(true);

      const pluginPanels = visibilityManager.getPanelsByType('plugin');
      expect(pluginPanels.size).toBe(1);
      expect(pluginPanels.has('flag-parameter-panel')).toBe(true);

      const panel = pluginPanels.get('flag-parameter-panel');
      expect(panel?.metadata?.pluginName).toBe('flag-simulation');
      expect(panel?.metadata?.componentType).toBe('FlagComponent');
      expect(panel?.metadata?.priority).toBe(10);
      expect(panel?.metadata?.parameterPanel).toBe(mockParameterPanel);
    });

    it('should handle multiple plugin panels from same plugin', () => {
      const flagPanel = { componentType: 'FlagComponent' };
      const polePanel = { componentType: 'PoleComponent' };

      visibilityManager.registerPluginPanel(
        'flag-panel',
        flagPanel,
        pluginContainer,
        { pluginName: 'flag-simulation', componentType: 'FlagComponent' }
      );

      visibilityManager.registerPluginPanel(
        'pole-panel',
        polePanel,
        pluginContainer,
        { pluginName: 'flag-simulation', componentType: 'PoleComponent' }
      );

      const flagSimPanels = visibilityManager.getPanelsByPlugin('flag-simulation');
      expect(flagSimPanels.size).toBe(2);
      expect(flagSimPanels.has('flag-panel')).toBe(true);
      expect(flagSimPanels.has('pole-panel')).toBe(true);
    });

    it('should toggle panels by plugin name', () => {
      const waterDropletPanel = { componentType: 'WaterDropletComponent' };
      const waterBodyPanel = { componentType: 'WaterBodyComponent' };

      visibilityManager.registerPluginPanel(
        'water-droplet-panel',
        waterDropletPanel,
        pluginContainer,
        { pluginName: 'water-simulation', componentType: 'WaterDropletComponent' }
      );

      visibilityManager.registerPluginPanel(
        'water-body-panel',
        waterBodyPanel,
        pluginContainer,
        { pluginName: 'water-simulation', componentType: 'WaterBodyComponent' }
      );

      // Hide all water simulation panels
      visibilityManager.togglePluginPanels('water-simulation', false);
      expect(visibilityManager.isPanelVisible('water-droplet-panel')).toBe(false);
      expect(visibilityManager.isPanelVisible('water-body-panel')).toBe(false);

      // Show all water simulation panels
      visibilityManager.togglePluginPanels('water-simulation', true);
      expect(visibilityManager.isPanelVisible('water-droplet-panel')).toBe(true);
      expect(visibilityManager.isPanelVisible('water-body-panel')).toBe(true);
    });

    it('should emit pluginPanelToggled events', () => {
      const onPluginToggle = jest.fn();
      visibilityManager.on('pluginPanelToggled', onPluginToggle);

      const parameterPanel = { componentType: 'FlagComponent' };
      visibilityManager.registerPluginPanel(
        'flag-panel',
        parameterPanel,
        pluginContainer,
        { pluginName: 'flag-simulation' }
      );

      // Get the created element
      const panel = visibilityManager.getPanelsByType('plugin').get('flag-panel');
      const element = panel?.element;

      visibilityManager.hidePanel('flag-panel');
      expect(onPluginToggle).toHaveBeenCalledWith({
        panelId: 'flag-panel',
        visible: false,
        element,
        type: 'plugin',
        metadata: expect.objectContaining({
          pluginName: 'flag-simulation',
          parameterPanel
        })
      });
    });

    it('should show/hide all plugin panels', () => {
      const flagPanel = { componentType: 'FlagComponent' };
      const waterPanel = { componentType: 'WaterDropletComponent' };

      visibilityManager.registerPluginPanel('flag-panel', flagPanel, pluginContainer);
      visibilityManager.registerPluginPanel('water-panel', waterPanel, pluginContainer);

      // Hide all plugin panels
      visibilityManager.hideAllPluginPanels();
      expect(visibilityManager.isPanelVisible('flag-panel')).toBe(false);
      expect(visibilityManager.isPanelVisible('water-panel')).toBe(false);

      // Show all plugin panels
      visibilityManager.showAllPluginPanels();
      expect(visibilityManager.isPanelVisible('flag-panel')).toBe(true);
      expect(visibilityManager.isPanelVisible('water-panel')).toBe(true);
    });
  });

  describe('Mixed Panel Management', () => {
    beforeEach(() => {
      // Register mixed panels
      const globalFolder = { element: document.createElement('div') };
      const flagPanel = { componentType: 'FlagComponent' };
      const waterPanel = { componentType: 'WaterDropletComponent' };

      visibilityManager.registerGlobalPanel('global-controls', globalFolder, globalContainer);
      visibilityManager.registerPluginPanel('flag-panel', flagPanel, pluginContainer,
        { pluginName: 'flag-simulation' });
      visibilityManager.registerPluginPanel('water-panel', waterPanel, pluginContainer,
        { pluginName: 'water-simulation' });
    });

    it('should filter panels by type correctly', () => {
      const globalPanels = visibilityManager.getPanelsByType('global');
      const pluginPanels = visibilityManager.getPanelsByType('plugin');
      const systemPanels = visibilityManager.getPanelsByType('system');

      expect(globalPanels.size).toBe(1);
      expect(pluginPanels.size).toBe(2);
      expect(systemPanels.size).toBe(0);

      expect(globalPanels.has('global-controls')).toBe(true);
      expect(pluginPanels.has('flag-panel')).toBe(true);
      expect(pluginPanels.has('water-panel')).toBe(true);
    });

    it('should handle selective visibility management', () => {
      // Hide only global panels
      visibilityManager.hideAllGlobalPanels();
      expect(visibilityManager.isPanelVisible('global-controls')).toBe(false);
      expect(visibilityManager.isPanelVisible('flag-panel')).toBe(true);
      expect(visibilityManager.isPanelVisible('water-panel')).toBe(true);

      // Hide only plugin panels
      visibilityManager.hideAllPluginPanels();
      expect(visibilityManager.isPanelVisible('global-controls')).toBe(false);
      expect(visibilityManager.isPanelVisible('flag-panel')).toBe(false);
      expect(visibilityManager.isPanelVisible('water-panel')).toBe(false);

      // Show all
      visibilityManager.showAllPanels();
      expect(visibilityManager.isPanelVisible('global-controls')).toBe(true);
      expect(visibilityManager.isPanelVisible('flag-panel')).toBe(true);
      expect(visibilityManager.isPanelVisible('water-panel')).toBe(true);
    });

    it('should provide comprehensive panel state information', () => {
      const allStates = visibilityManager.getAllPanelStates();
      expect(Object.keys(allStates)).toHaveLength(3);
      expect(allStates['global-controls']).toBe(true);
      expect(allStates['flag-panel']).toBe(true);
      expect(allStates['water-panel']).toBe(true);

      // Change some states
      visibilityManager.hidePanel('flag-panel');
      const updatedStates = visibilityManager.getAllPanelStates();
      expect(updatedStates['flag-panel']).toBe(false);
      expect(updatedStates['global-controls']).toBe(true);
      expect(updatedStates['water-panel']).toBe(true);
    });
  });

  describe('Panel Element Management', () => {
    it('should create panel elements for parameter panels without elements', () => {
      const parameterPanel = { componentType: 'TestComponent' };

      visibilityManager.registerPluginPanel(
        'test-panel',
        parameterPanel,
        pluginContainer
      );

      const panel = visibilityManager.getPanelsByType('plugin').get('test-panel');
      expect(panel?.element).toBeDefined();
      expect(panel?.element.className).toBe('parameter-panel');
      expect(panel?.element.id).toBe('parameter-panel-test-panel');
      expect(panel?.element.getAttribute('data-panel-id')).toBe('test-panel');
    });

    it('should use existing elements from parameter panels', () => {
      const existingElement = document.createElement('div');
      existingElement.className = 'existing-panel';

      const parameterPanel = {
        componentType: 'TestComponent',
        element: existingElement
      };

      visibilityManager.registerPluginPanel(
        'test-panel',
        parameterPanel,
        pluginContainer
      );

      const panel = visibilityManager.getPanelsByType('plugin').get('test-panel');
      expect(panel?.element).toBe(existingElement);
      expect(panel?.element.className).toBe('existing-panel');
    });
  });

  describe('Event System', () => {
    it('should emit appropriate events for different panel types', () => {
      const onVisibilityChanged = jest.fn();
      const onGlobalToggled = jest.fn();
      const onPluginToggled = jest.fn();
      const onPanelRegistered = jest.fn();

      visibilityManager.on('visibilityChanged', onVisibilityChanged);
      visibilityManager.on('globalPanelToggled', onGlobalToggled);
      visibilityManager.on('pluginPanelToggled', onPluginToggled);
      visibilityManager.on('panelRegistered', onPanelRegistered);

      // Register and test global panel
      const globalFolder = { element: document.createElement('div') };
      visibilityManager.registerGlobalPanel('global-test', globalFolder, globalContainer);

      expect(onPanelRegistered).toHaveBeenCalledWith({
        panelId: 'global-test',
        visible: true,
        element: globalFolder.element,
        type: 'global',
        metadata: expect.objectContaining({ tweakpaneFolder: globalFolder })
      });

      // Register and test plugin panel
      const pluginPanel = { componentType: 'TestComponent' };
      visibilityManager.registerPluginPanel('plugin-test', pluginPanel, pluginContainer);

      expect(onPanelRegistered).toHaveBeenCalledWith({
        panelId: 'plugin-test',
        visible: true,
        element: expect.any(HTMLElement),
        type: 'plugin',
        metadata: expect.objectContaining({ parameterPanel: pluginPanel })
      });

      // Test visibility events
      visibilityManager.hidePanel('global-test');
      expect(onVisibilityChanged).toHaveBeenCalledWith(expect.objectContaining({
        panelId: 'global-test',
        visible: false,
        type: 'global'
      }));
      expect(onGlobalToggled).toHaveBeenCalledWith(expect.objectContaining({
        panelId: 'global-test',
        visible: false,
        type: 'global'
      }));

      visibilityManager.hidePanel('plugin-test');
      expect(onPluginToggled).toHaveBeenCalledWith(expect.objectContaining({
        panelId: 'plugin-test',
        visible: false,
        type: 'plugin'
      }));
    });
  });
});
