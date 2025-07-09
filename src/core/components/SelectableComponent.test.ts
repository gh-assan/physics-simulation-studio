import {SelectableComponent} from './SelectableComponent';

// Helper to simulate ECS-style deserialization
function deserializeSelectableComponent(json: string) {
  const parsed = JSON.parse(json);
  return Object.assign(new SelectableComponent(), parsed);
}

describe('SelectableComponent', () => {
  it('should store the isSelected state', () => {
    const comp = new SelectableComponent(true);
    expect(comp.isSelected).toBe(true);
    comp.isSelected = false;
    expect(comp.isSelected).toBe(false);
  });

  it('should default isSelected to false', () => {
    const comp = new SelectableComponent();
    expect(comp.isSelected).toBe(false);
  });

  it('should be serializable and deserializable', () => {
    const original = new SelectableComponent(true);
    const json = JSON.stringify(original);
    const restored = deserializeSelectableComponent(json);
    expect(restored.isSelected).toBe(true);
  });

  it('should preserve prototype after deserialization', () => {
    const original = new SelectableComponent(true);
    const json = JSON.stringify(original);
    const restored = deserializeSelectableComponent(json);
    expect(restored instanceof SelectableComponent).toBe(true);
  });

  it('should allow toggling selection', () => {
    const comp = new SelectableComponent();
    comp.isSelected = !comp.isSelected;
    expect(comp.isSelected).toBe(true);
    comp.isSelected = !comp.isSelected;
    expect(comp.isSelected).toBe(false);
  });

  it('should support round-trip serialization/deserialization', () => {
    const original = new SelectableComponent(false);
    original.isSelected = true;
    const json = JSON.stringify(original);
    const restored = deserializeSelectableComponent(json);
    expect(restored.isSelected).toBe(original.isSelected);
  });

  it('should ignore extra properties during deserialization', () => {
    const json = JSON.stringify({isSelected: true, extra: 123});
    const restored = deserializeSelectableComponent(json);
    expect(restored.isSelected).toBe(true);
    expect(restored.extra).toBe(123); // extra property is present, but does not break component
  });

  it('should handle missing isSelected property gracefully', () => {
    const json = JSON.stringify({});
    const restored = deserializeSelectableComponent(json);
    // Should default to false if not present
    expect(restored.isSelected).toBe(false);
  });
});
