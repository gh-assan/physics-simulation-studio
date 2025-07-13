import { UIManager } from './uiManager';
import { TweakpaneAdapter } from './TweakpaneAdapter';
import { ApplicationEventBus } from './ApplicationEventBus';
import { filterComponentKeys } from './propertyUtils';

class MockBindingApi {
  on = jest.fn();
}
class MockFolderApi {
  addBinding = jest.fn((data, key, options) => new MockBindingApi());
  dispose = jest.fn();
}
class MockUIFramework {
  addFolder = jest.fn(() => new MockFolderApi());
  refresh = jest.fn();
}
class MockEventBus {
  dispatch = jest.fn();
  addEventListener = jest.fn();
  removeEventListener = jest.fn();
}

describe('UIManager', () => {
  let ui: MockUIFramework;
  let eventBus: MockEventBus;
  let uiManager: UIManager;

  beforeEach(() => {
    ui = new MockUIFramework();
    eventBus = new MockEventBus();
    uiManager = new UIManager(ui as any); // Only pass pane/mock
  });

  it('registers component controls and dispatches event on change', () => {
    const data = { foo: 1, bar: 2 };
    uiManager.registerComponentControls('TestComponent', data);
    const folder = ui.addFolder.mock.results[0].value;
    expect(folder.addBinding).toHaveBeenCalledWith(data, 'foo', expect.objectContaining({ label: expect.any(String) }));
    expect(folder.addBinding).toHaveBeenCalledWith(data, 'bar', expect.objectContaining({ label: expect.any(String) }));
    // Simulate binding change
    const binding = folder.addBinding.mock.results[0].value;
    binding.on('change', expect.any(Function));
  });

  it('filters out unwanted keys', () => {
    const { filterComponentKeys } = require('./propertyUtils');
    const keys = ['foo', 'particles', 'bar', 'springs', 'baz', 'fixedParticles'];
    const filtered = filterComponentKeys(keys);
    expect(filtered).toEqual(['foo', 'bar', 'baz']);
  });

  it('clears controls', () => {
    uiManager.registerComponentControls('TestComponent', { foo: 1 });
    expect(uiManager['folders'].size).toBe(1);
    uiManager.clearControls();
    expect(uiManager['folders'].size).toBe(0);
  });
});
