import { getSelectedRenderMode } from '../rendering/getSelectedRenderMode';

describe('getSelectedRenderMode runtime selection', () => {
  const originalEnv = process.env.RENDER_MODE;

  beforeEach(() => {
    // Reset URL using history API (jsdom-compatible)
    window.history.pushState({}, '', 'http://localhost/');
    // Clear localStorage
    window.localStorage.clear();
    // Clear env
    delete process.env.RENDER_MODE;
  });

  afterAll(() => {
    process.env.RENDER_MODE = originalEnv;
  });

  it('defaults to adapter when nothing is set', () => {
    expect(getSelectedRenderMode()).toBe('adapter');
  });

  it('uses URL param renderMode=adapter', () => {
    window.history.pushState({}, '', 'http://localhost/?renderMode=adapter');
    expect(getSelectedRenderMode()).toBe('adapter');
  });

  it('uses localStorage renderMode key', () => {
    window.localStorage.setItem('renderMode', 'adapter');
    expect(getSelectedRenderMode()).toBe('adapter');
  });

  it('uses localStorage studio.renderMode key', () => {
    window.localStorage.setItem('studio.renderMode', 'adapter');
    expect(getSelectedRenderMode()).toBe('adapter');
  });

  it('uses process.env.RENDER_MODE when set', () => {
    process.env.RENDER_MODE = 'adapter';
    expect(getSelectedRenderMode()).toBe('adapter');
  });
});
