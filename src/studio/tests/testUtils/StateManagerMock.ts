// Shared robust singleton mock for StateManager
export const mockStateManager = () => {
  const ActualStateManager = jest.requireActual("../../state/StateManager").StateManager;
  const instance = new ActualStateManager();
  return {
    StateManager: Object.assign(jest.fn().mockImplementation(() => instance), {
      getInstance: jest.fn(() => instance)
    }),
    getInstance: jest.fn(() => instance)
  };
};
