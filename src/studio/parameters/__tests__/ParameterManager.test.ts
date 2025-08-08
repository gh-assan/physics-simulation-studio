import { ParameterManager } from '../ParameterManager';
import { IParameterDefinition } from '../../../core/simulation/interfaces';

describe('ParameterManager', () => {
  let parameterManager: ParameterManager;
  const testAlgorithm = 'testAlgorithm';

  beforeEach(() => {
    parameterManager = new ParameterManager();
  });

  describe('Initialization', () => {
    it('should initialize with empty parameters', () => {
      expect(parameterManager.getParameters(testAlgorithm)).toEqual([]);
      expect(parameterManager.getParameterValues(testAlgorithm)).toEqual({});
    });
  });

  describe('Parameter Registration', () => {
    it('should register a number parameter', () => {
      const definition: IParameterDefinition = {
        name: 'speed',
        type: 'number',
        defaultValue: 5.0,
        category: 'physics',
        constraints: { min: 0, max: 10 }
      };

      parameterManager.registerParameter(testAlgorithm, definition);

      expect(parameterManager.getParameterValue(testAlgorithm, 'speed')).toBe(5.0);
      expect(parameterManager.getParameters(testAlgorithm)).toHaveLength(1);
      expect(parameterManager.getParameters(testAlgorithm)[0].name).toBe('speed');
    });

    it('should register a boolean parameter', () => {
      const definition: IParameterDefinition = {
        name: 'enabled',
        type: 'boolean',
        defaultValue: true,
        category: 'physics'
      };

      parameterManager.registerParameter(testAlgorithm, definition);

      expect(parameterManager.getParameterValue(testAlgorithm, 'enabled')).toBe(true);
    });

    it('should register an enum parameter', () => {
      const definition: IParameterDefinition = {
        name: 'mode',
        type: 'enum',
        defaultValue: 'auto',
        category: 'algorithm',
        constraints: { options: ['auto', 'manual', 'custom'] }
      };

      parameterManager.registerParameter(testAlgorithm, definition);

      expect(parameterManager.getParameterValue(testAlgorithm, 'mode')).toBe('auto');
    });

    it('should register a vector parameter', () => {
      const definition: IParameterDefinition = {
        name: 'position',
        type: 'vector',
        defaultValue: { x: 0, y: 0, z: 0 },
        category: 'physics'
      };

      parameterManager.registerParameter(testAlgorithm, definition);

      expect(parameterManager.getParameterValue(testAlgorithm, 'position')).toEqual({ x: 0, y: 0, z: 0 });
    });

    it('should register a color parameter', () => {
      const definition: IParameterDefinition = {
        name: 'fillColor',
        type: 'color',
        defaultValue: '#ff0000',
        category: 'visual'
      };

      parameterManager.registerParameter(testAlgorithm, definition);

      expect(parameterManager.getParameterValue(testAlgorithm, 'fillColor')).toBe('#ff0000');
    });

    it('should register multiple parameters at once', () => {
      const definitions: IParameterDefinition[] = [
        {
          name: 'speed',
          type: 'number',
          defaultValue: 5.0,
          category: 'physics'
        },
        {
          name: 'enabled',
          type: 'boolean',
          defaultValue: true,
          category: 'physics'
        }
      ];

      parameterManager.registerParameters(testAlgorithm, definitions);

      expect(parameterManager.getParameters(testAlgorithm)).toHaveLength(2);
    });
  });

  describe('Parameter Access', () => {
    beforeEach(() => {
      parameterManager.registerParameter(testAlgorithm, {
        name: 'speed',
        type: 'number',
        defaultValue: 5.0,
        category: 'physics',
        constraints: { min: 0, max: 10 }
      });
    });

    it('should get existing parameter value', () => {
      expect(parameterManager.getParameterValue(testAlgorithm, 'speed')).toBe(5.0);
    });

    it('should return undefined for non-existent parameter', () => {
      expect(parameterManager.getParameter(testAlgorithm, 'nonexistent')).toBeUndefined();
    });

    it('should return all parameter values', () => {
      const values = parameterManager.getParameterValues(testAlgorithm);
      expect(values.speed).toBe(5.0);
    });

    it('should return all parameters', () => {
      const params = parameterManager.getParameters(testAlgorithm);
      expect(params).toHaveLength(1);
      expect(params[0].name).toBe('speed');
    });

    it('should return parameters by category', () => {
      parameterManager.registerParameter(testAlgorithm, {
        name: 'color',
        type: 'color',
        defaultValue: '#ff0000',
        category: 'visual'
      });

      const categorized = parameterManager.getParametersByCategory(testAlgorithm);
      expect(categorized.get('physics')).toHaveLength(1);
      expect(categorized.get('visual')).toHaveLength(1);
    });
  });

  describe('Parameter Updates', () => {
    beforeEach(() => {
      parameterManager.registerParameter(testAlgorithm, {
        name: 'speed',
        type: 'number',
        defaultValue: 5.0,
        category: 'physics',
        constraints: { min: 0, max: 10 }
      });
    });

    it('should update valid parameter value', () => {
      parameterManager.setParameter(testAlgorithm, 'speed', 7.5);
      expect(parameterManager.getParameterValue(testAlgorithm, 'speed')).toBe(7.5);
    });
  });

  describe('Number Parameter Validation', () => {
    beforeEach(() => {
      parameterManager.registerParameter(testAlgorithm, {
        name: 'speed',
        type: 'number',
        defaultValue: 5.0,
        category: 'physics',
        constraints: { min: 0, max: 10 }
      });
    });

    it('should accept valid number within range', () => {
      const result = parameterManager.validateParameter(testAlgorithm, 'speed', 7.5);
      expect(result).toBe(true);
    });

    it('should reject number below minimum', () => {
      const result = parameterManager.validateParameter(testAlgorithm, 'speed', -1);
      expect(result).toContain('must be >= 0');
    });

    it('should reject number above maximum', () => {
      const result = parameterManager.validateParameter(testAlgorithm, 'speed', 15);
      expect(result).toContain('must be <= 10');
    });

    it('should reject non-number values', () => {
      const result = parameterManager.validateParameter(testAlgorithm, 'speed', 'fast');
      expect(result).toContain('must be a valid number');
    });
  });

  describe('Boolean Parameter Validation', () => {
    beforeEach(() => {
      parameterManager.registerParameter(testAlgorithm, {
        name: 'enabled',
        type: 'boolean',
        defaultValue: false,
        category: 'physics'
      });
    });

    it('should accept valid boolean values', () => {
      expect(parameterManager.validateParameter(testAlgorithm, 'enabled', true)).toBe(true);
      expect(parameterManager.validateParameter(testAlgorithm, 'enabled', false)).toBe(true);
    });

    it('should reject non-boolean values', () => {
      const result = parameterManager.validateParameter(testAlgorithm, 'enabled', 1);
      expect(result).toContain('must be a boolean');
    });
  });

  describe('Enum Parameter Validation', () => {
    beforeEach(() => {
      parameterManager.registerParameter(testAlgorithm, {
        name: 'mode',
        type: 'enum',
        defaultValue: 'auto',
        category: 'algorithm',
        constraints: { options: ['auto', 'manual', 'custom'] }
      });
    });

    it('should accept valid enum option', () => {
      const result = parameterManager.validateParameter(testAlgorithm, 'mode', 'manual');
      expect(result).toBe(true);
    });

    it('should reject invalid enum option', () => {
      const result = parameterManager.validateParameter(testAlgorithm, 'mode', 'invalid');
      expect(result).toContain('must be one of:');
    });
  });

  describe('Vector Parameter Validation', () => {
    beforeEach(() => {
      parameterManager.registerParameter(testAlgorithm, {
        name: 'position',
        type: 'vector',
        defaultValue: { x: 0, y: 0, z: 0 },
        category: 'physics'
      });
    });

    it('should accept valid vector object', () => {
      const result = parameterManager.validateParameter(testAlgorithm, 'position', { x: 10, y: 20, z: 30 });
      expect(result).toBe(true);
    });

    it('should reject non-object values', () => {
      const result = parameterManager.validateParameter(testAlgorithm, 'position', 'invalid');
      expect(result).toContain('Vector must be an object');
    });

    it('should reject object without x property', () => {
      const result = parameterManager.validateParameter(testAlgorithm, 'position', { y: 5, z: 0 });
      expect(result).toContain('Vector.x must be a valid number');
    });

    it('should reject object with non-number properties', () => {
      const result = parameterManager.validateParameter(testAlgorithm, 'position', { x: 'five', y: 10, z: 0 });
      expect(result).toContain('Vector.x must be a valid number');
    });
  });

  describe('Color Parameter Validation', () => {
    beforeEach(() => {
      parameterManager.registerParameter(testAlgorithm, {
        name: 'fillColor',
        type: 'color',
        defaultValue: '#ff0000',
        category: 'visual'
      });
    });

    it('should accept valid hex color', () => {
      const result = parameterManager.validateParameter(testAlgorithm, 'fillColor', '#00ff00');
      expect(result).toBe(true);
    });

    it('should reject invalid hex color format', () => {
      const result = parameterManager.validateParameter(testAlgorithm, 'fillColor', 'red');
      expect(result).toContain('valid hex string');
    });
  });

  describe('Reset Functionality', () => {
    beforeEach(() => {
      parameterManager.registerParameter(testAlgorithm, {
        name: 'speed',
        type: 'number',
        defaultValue: 5.0,
        category: 'physics'
      });

      parameterManager.registerParameter(testAlgorithm, {
        name: 'enabled',
        type: 'boolean',
        defaultValue: false,
        category: 'physics'
      });

      // Modify values
      parameterManager.setParameter(testAlgorithm, 'speed', 10.0);
      parameterManager.setParameter(testAlgorithm, 'enabled', true);
    });

    it('should reset single parameter to default', () => {
      parameterManager.resetParameter(testAlgorithm, 'speed');

      expect(parameterManager.getParameterValue(testAlgorithm, 'speed')).toBe(5.0);
      expect(parameterManager.getParameterValue(testAlgorithm, 'enabled')).toBe(true); // Unchanged
    });

    it('should reset all parameters to defaults', () => {
      parameterManager.resetParameters(testAlgorithm);

      expect(parameterManager.getParameterValue(testAlgorithm, 'speed')).toBe(5.0);
      expect(parameterManager.getParameterValue(testAlgorithm, 'enabled')).toBe(false);
    });
  });

  describe('Algorithm Management', () => {
    beforeEach(() => {
      parameterManager.registerParameter(testAlgorithm, {
        name: 'speed',
        type: 'number',
        defaultValue: 5.0,
        category: 'physics'
      });
    });

    it('should unregister all parameters for an algorithm', () => {
      parameterManager.unregisterParameters(testAlgorithm);

      expect(parameterManager.getParameters(testAlgorithm)).toEqual([]);
      expect(parameterManager.getParameterValues(testAlgorithm)).toEqual({});
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      parameterManager.registerParameter('algorithm1', {
        name: 'speed',
        type: 'number',
        defaultValue: 5.0,
        category: 'physics'
      });

      parameterManager.registerParameter('algorithm2', {
        name: 'color',
        type: 'color',
        defaultValue: '#ff0000',
        category: 'visual'
      });
    });

    it('should provide statistics', () => {
      const stats = parameterManager.getStats();

      expect(stats.algorithmCount).toBe(2);
      expect(stats.totalParameters).toBe(2);
      expect(stats.parametersByCategory.physics).toBe(1);
      expect(stats.parametersByCategory.visual).toBe(1);
    });
  });
});
