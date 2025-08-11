import { FlagSimulationPlugin } from '../index';

describe('FlagSimulationPlugin Parameter Schema', () => {
  test('should provide parameter schema with FlagComponent parameters', () => {
    // TDD: Write failing test first - this should fail initially
    const plugin = new FlagSimulationPlugin();
    const schema = plugin.getParameterSchema();

    expect(schema).toBeDefined();
    expect(schema.pluginId).toBe('flag-simulation');
    expect(schema.components).toBeDefined();
    expect(schema.components instanceof Map).toBe(true);

    // Should have FlagComponent parameters
    expect(schema.components.has('FlagComponent')).toBe(true);

    const flagComponentSchema = schema.components.get('FlagComponent');
    expect(flagComponentSchema).toBeDefined();
    expect(Array.isArray(flagComponentSchema)).toBe(true);

    // Should include expected flag parameters as array elements
    const windStrengthParam = flagComponentSchema.find((p: any) => p.key === 'windStrength');
    const dampingParam = flagComponentSchema.find((p: any) => p.key === 'damping');
    const stiffnessParam = flagComponentSchema.find((p: any) => p.key === 'stiffness');

    expect(windStrengthParam).toBeDefined();
    expect(dampingParam).toBeDefined();
    expect(stiffnessParam).toBeDefined();
  });

  test('should provide parameter schema with PoleComponent parameters', () => {
    // TDD: This should also fail initially
    const plugin = new FlagSimulationPlugin();
    const schema = plugin.getParameterSchema();

    expect(schema.components.has('PoleComponent')).toBe(true);

    const poleComponentSchema = schema.components.get('PoleComponent');
    expect(poleComponentSchema).toBeDefined();
    expect(Array.isArray(poleComponentSchema)).toBe(true);

    // Should include expected pole parameters as array elements
    const heightParam = poleComponentSchema.find((p: any) => p.key === 'height');
    expect(heightParam).toBeDefined();
  });
});
