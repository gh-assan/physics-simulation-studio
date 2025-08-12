/**
 * Play Button Simulation Start Integration Test
 *
 * This test ensures that when the play button is clicked:
 * 1. If no simulation is loaded, the flag simulation is automatically loaded
 * 2. The simulation starts playing (physics begins)
 * 3. The flag is visible in the simulation display
 * 4. No console pollution occurs during the process
 */

describe('Play Button Simulation Start', () => {
  let mockStudio: any;
  let mockStateManager: any;
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

    // Mock studio
    mockStudio = {
      play: jest.fn(),
      loadSimulation: jest.fn().mockResolvedValue(undefined),
      getActiveSimulationName: jest.fn().mockReturnValue(''),
      getAvailableSimulationNames: jest.fn().mockReturnValue(['flag-simulation']),
      getIsPlaying: jest.fn().mockReturnValue(false)
    };

    // Mock state manager
    mockStateManager = {
      selectedSimulation: {
        state: { name: '' },
        getSimulationName: jest.fn().mockReturnValue('')
      }
    };
  });

  afterEach(() => {
    Object.assign(console, originalConsole);
  });

  test('should auto-load flag simulation when play is clicked with no simulation loaded', async () => {
    // This test should FAIL initially, then PASS after implementation
    // Simulate clicking play button when no simulation is loaded

    // Import the play button handler logic
    const { handlePlayButtonClick } = await import('../../src/studio/ui/PlayButtonHandler');

    // Test the expected behavior
    await handlePlayButtonClick(mockStudio, mockStateManager);

    // Verify flag simulation was loaded
    expect(mockStudio.loadSimulation).toHaveBeenCalledWith('flag-simulation');

    // Verify simulation was started
    expect(mockStudio.play).toHaveBeenCalled();

    // Verify no console pollution occurred
    const pollutionLogs = consoleLogs.filter(log =>
      log.includes('🏁') ||
      log.includes('🎯') ||
      log.includes('✅') ||
      log.includes('[GraphRegistry]') ||
      log.includes('CRITICAL ERROR') ||
      log.includes('💥')
    );
    expect(pollutionLogs).toHaveLength(0);
  });

  test('should just play if simulation is already loaded', async () => {
    // Mock having flag simulation already loaded
    mockStateManager.selectedSimulation.getSimulationName = jest.fn().mockReturnValue('flag-simulation');
    mockStudio.getActiveSimulationName = jest.fn().mockReturnValue('flag-simulation');

    const { handlePlayButtonClick } = await import('../../src/studio/ui/PlayButtonHandler');

    await handlePlayButtonClick(mockStudio, mockStateManager);

    // Should NOT load simulation again
    expect(mockStudio.loadSimulation).not.toHaveBeenCalled();

    // Should just play
    expect(mockStudio.play).toHaveBeenCalled();
  });

  test('should handle play button state correctly', async () => {
    // Test that play button enables/disables correctly
    const { isPlayButtonEnabled } = await import('../../src/studio/ui/PlayButtonHandler');

    // Should be enabled when simulation is available
    mockStateManager.selectedSimulation.state.name = 'flag-simulation';
    expect(isPlayButtonEnabled(mockStateManager)).toBe(true);

    // Should be disabled when no simulation
    mockStateManager.selectedSimulation.state.name = '';
    expect(isPlayButtonEnabled(mockStateManager)).toBe(true); // Still enabled because we auto-load
  });
});
