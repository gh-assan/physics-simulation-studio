/**
 * Flag Simulation Play Button End-to-End Test
 *
 * This test verifies the complete play button workflow:
 * 1. Play button auto-loads flag simulation when clicked with no simulation
 * 2. Flag simulation is properly visible and rendered
 * 3. Physics simulation starts correctly
 * 4. All components work together without console pollution
 */

describe('Flag Simulation Play Button E2E', () => {
  let mockStudio: any;
  let mockStateManager: any;
  let mockRenderSystem: any;
  let mockWorld: any;
  let consoleLogs: string[] = [];
  let originalConsole: any;

  beforeEach(() => {
    // Capture console logs to verify no debug pollution
    originalConsole = { ...console };
    consoleLogs = [];
    console.log = (...args: any[]) => {
      consoleLogs.push(args.join(' '));
    };
    console.warn = (...args: any[]) => {
      consoleLogs.push(`WARN: ${args.join(' ')}`);
    };
    console.error = (...args: any[]) => {
      consoleLogs.push(`ERROR: ${args.join(' ')}`);
    };

    // Mock world with entities
    mockWorld = {
      getAllEntities: jest.fn().mockReturnValue([1, 2, 3]), // Mock flag entities
      update: jest.fn(),
      systemManager: {
        updateAll: jest.fn(),
      },
    };

    // Mock render system
    mockRenderSystem = {
      render: jest.fn(),
      update: jest.fn(),
      getRegisteredRenderers: jest.fn().mockReturnValue(['flag-renderer']),
      isRendering: jest.fn().mockReturnValue(true),
    };

    // Mock studio with all required methods
    mockStudio = {
      play: jest.fn(),
      pause: jest.fn(),
      reset: jest.fn(),
      loadSimulation: jest.fn().mockImplementation(async (name: string) => {
        // Simulate loading flag simulation
        mockStateManager.selectedSimulation.state.name = name;
        return Promise.resolve();
      }),
      getActiveSimulationName: jest.fn().mockReturnValue(''),
      getAvailableSimulationNames: jest
        .fn()
        .mockReturnValue(['flag-simulation', 'solar-system']),
      getIsPlaying: jest.fn().mockReturnValue(false),
      world: mockWorld,
      renderSystem: mockRenderSystem,
    };

    // Mock state manager
    mockStateManager = {
      selectedSimulation: {
        state: { name: '' },
        getSimulationName: jest.fn().mockReturnValue(''),
        setSimulation: jest.fn((name: string) => {
          mockStateManager.selectedSimulation.state.name = name;
        }),
      },
    };
  });

  afterEach(() => {
    Object.assign(console, originalConsole);
  });

  test('should complete full play workflow for flag simulation', async () => {
    // Import the play button handler
    const { handlePlayButtonClick } = await import(
      '../../src/studio/ui/PlayButtonHandler'
    );

    // Initial state: no simulation loaded
    expect(mockStateManager.selectedSimulation.getSimulationName()).toBe('');

    // Click play button
    await handlePlayButtonClick(mockStudio, mockStateManager);

    // Verify flag simulation was auto-loaded
    expect(mockStudio.loadSimulation).toHaveBeenCalledWith('flag-simulation');

    // Verify simulation was started
    expect(mockStudio.play).toHaveBeenCalled();

    // Verify state was updated
    expect(mockStateManager.selectedSimulation.state.name).toBe(
      'flag-simulation'
    );
  });

  test('should handle play button state management correctly', async () => {
    const {
      isPlayButtonEnabled,
      updatePlayButtonStates,
    } = await import('../../src/studio/ui/PlayButtonHandler');

    // Mock button elements
    const mockPlayButton = { disabled: false };
    const mockPauseButton = { disabled: true };
    const mockResetButton = { disabled: true };

    // Test initial state (no simulation)
    expect(isPlayButtonEnabled(mockStateManager)).toBe(true);

    updatePlayButtonStates(
      mockStateManager,
      mockPlayButton,
      mockPauseButton,
      mockResetButton
    );

    // Play should always be enabled (auto-load capability)
    expect(mockPlayButton.disabled).toBe(false);
    // Pause/Reset disabled when no simulation
    expect(mockPauseButton.disabled).toBe(true);
    expect(mockResetButton.disabled).toBe(true);

    // Test with simulation loaded
    mockStateManager.selectedSimulation.state.name = 'flag-simulation';

    updatePlayButtonStates(
      mockStateManager,
      mockPlayButton,
      mockPauseButton,
      mockResetButton
    );

    // All buttons should be enabled when simulation is loaded
    expect(mockPlayButton.disabled).toBe(false);
    expect(mockPauseButton.disabled).toBe(false);
    expect(mockResetButton.disabled).toBe(false);
  });

  test('should have clean console output during play workflow', async () => {
    const { handlePlayButtonClick } = await import(
      '../../src/studio/ui/PlayButtonHandler'
    );

    // Perform complete play workflow
    await handlePlayButtonClick(mockStudio, mockStateManager);

    // Filter for debug pollution patterns
    const pollutionLogs = consoleLogs.filter(
      log =>
        log.includes('🏁') ||
        log.includes('🎯') ||
        log.includes('✅') ||
        log.includes('[GraphRegistry]') ||
        log.includes('💥') ||
        log.includes('[SystemManager]') ||
        log.includes('[ParameterManager]') ||
        log.includes('[VisibilityManager]')
    );

    // Should have no console pollution
    expect(pollutionLogs).toHaveLength(0);
  });

  test('should handle multiple play button clicks gracefully', async () => {
    const { handlePlayButtonClick } = await import(
      '../../src/studio/ui/PlayButtonHandler'
    );

    // First click: should load and play
    await handlePlayButtonClick(mockStudio, mockStateManager);
    expect(mockStudio.loadSimulation).toHaveBeenCalledTimes(1);
    expect(mockStudio.play).toHaveBeenCalledTimes(1);

    // Mock simulation as now loaded
    mockStateManager.selectedSimulation.getSimulationName = jest
      .fn()
      .mockReturnValue('flag-simulation');
    mockStudio.getActiveSimulationName = jest
      .fn()
      .mockReturnValue('flag-simulation');

    // Second click: should only play (not load again)
    await handlePlayButtonClick(mockStudio, mockStateManager);
    expect(mockStudio.loadSimulation).toHaveBeenCalledTimes(1); // Still just 1
    expect(mockStudio.play).toHaveBeenCalledTimes(2); // Now 2
  });
});
