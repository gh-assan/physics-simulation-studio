import { getLocation } from './locationHelper';

describe('getLocation', () => {
  it('should return window.location', () => {
    expect(getLocation()).toBe(window.location);
  });

  it('should return a Location object', () => {
    expect(getLocation()).toHaveProperty('href');
    expect(typeof getLocation().href).toBe('string');
  });

  it('should match window.location.href', () => {
    expect(getLocation().href).toBe(window.location.href);
  });
});
