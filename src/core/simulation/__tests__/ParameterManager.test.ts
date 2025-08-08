/**
 * ParameterManager Test Suite
 *
 * TDD: Testing parameter validation, registration, and management
 */

import { ParameterManager } from '../../../studio/parameters/ParameterManager';
import { IParameterDefinition, IParameterManager } from '../interfaces';

describe('ParameterManager', () => {
  let manager: IParameterManager;

  beforeEach(() => {
    manager = new ParameterManager();
  });

  describe('Parameter Registration', () => {
    const validParameter: IParameterDefinition = {
      name: 'testParam',
      type: 'number',
      defaultValue: 10,
      category: 'physics',
      description: 'Test parameter',
      units: 'units'
    };

    it('should register valid parameter', () => {
      manager.registerParameter('testAlgorithm', validParameter);

      const retrieved = manager.getParameter('testAlgorithm', 'testParam');
      expect(retrieved).toEqual(validParameter);
      expect(manager.getParameterValue('testAlgorithm', 'testParam')).toBe(10);
    });

    it('should register multiple parameters for same algorithm', () => {
      const param1: IParameterDefinition = { ...validParameter, name: 'param1' };
      const param2: IParameterDefinition = { ...validParameter, name: 'param2', defaultValue: 20 };

      manager.registerParameter('testAlgorithm', param1);
      manager.registerParameter('testAlgorithm', param2);

      const allParams = manager.getParameters('testAlgorithm');
      expect(allParams).toHaveLength(2);
      expect(allParams.find((p: IParameterDefinition) => p.name === 'param1')).toEqual(param1);
      expect(allParams.find((p: IParameterDefinition) => p.name === 'param2')).toEqual(param2);
    });

    it('should register parameters for multiple algorithms', () => {
      manager.registerParameter('algorithm1', validParameter);
      manager.registerParameter('algorithm2', { ...validParameter, name: 'otherParam' });

      expect(manager.getParameters('algorithm1')).toHaveLength(1);
      expect(manager.getParameters('algorithm2')).toHaveLength(1);
      expect(manager.getParameter('algorithm1', 'testParam')).toBeTruthy();
      expect(manager.getParameter('algorithm2', 'otherParam')).toBeTruthy();
    });

    it('should reject parameter without name', () => {
      const invalidParam = { ...validParameter, name: '' };

      expect(() => {
        manager.registerParameter('testAlgorithm', invalidParam);
      }).toThrow('Parameter must have a valid name');
    });

    it('should reject parameter without type', () => {
      const invalidParam = { ...validParameter, type: undefined as any };

      expect(() => {
        manager.registerParameter('testAlgorithm', invalidParam);
      }).toThrow('Parameter must have a valid type');
    });

    it('should reject parameter without category', () => {
      const invalidParam = { ...validParameter, category: undefined as any };

      expect(() => {
        manager.registerParameter('testAlgorithm', invalidParam);
      }).toThrow('Parameter must have a valid category');
    });

    it('should reject parameter without default value', () => {
      const invalidParam = { ...validParameter, defaultValue: undefined };

      expect(() => {
        manager.registerParameter('testAlgorithm', invalidParam);
      }).toThrow('Parameter must have a default value');
    });
  });

  describe('Parameter Unregistration', () => {
    beforeEach(() => {
      const param1: IParameterDefinition = {
        name: 'param1', type: 'number', defaultValue: 1, category: 'physics'
      };
      const param2: IParameterDefinition = {
        name: 'param2', type: 'number', defaultValue: 2, category: 'physics'
      };

      manager.registerParameter('algorithm1', param1);
      manager.registerParameter('algorithm1', param2);
      manager.registerParameter('algorithm2', param1);
    });

    it('should unregister all parameters for algorithm', () => {
      expect(manager.getParameters('algorithm1')).toHaveLength(2);

      manager.unregisterParameters('algorithm1');

      expect(manager.getParameters('algorithm1')).toHaveLength(0);
      expect(manager.getParameter('algorithm1', 'param1')).toBeUndefined();
      expect(manager.getParameterValue('algorithm1', 'param1')).toBeUndefined();

      // Other algorithm unaffected
      expect(manager.getParameters('algorithm2')).toHaveLength(1);
    });

    it('should handle unregistering non-existent algorithm gracefully', () => {
      expect(() => {
        manager.unregisterParameters('nonexistent');
      }).not.toThrow();
    });
  });

  describe('Parameter Validation', () => {
    beforeEach(() => {
      const numberParam: IParameterDefinition = {
        name: 'numberParam',
        type: 'number',
        defaultValue: 10,
        category: 'physics',
        constraints: { min: 0, max: 100, step: 1 }
      };

      const booleanParam: IParameterDefinition = {
        name: 'booleanParam',
        type: 'boolean',
        defaultValue: true,
        category: 'visual'
      };

      const enumParam: IParameterDefinition = {
        name: 'enumParam',
        type: 'enum',
        defaultValue: 'option1',
        category: 'algorithm',
        constraints: { options: ['option1', 'option2', 'option3'] }
      };

      const vectorParam: IParameterDefinition = {
        name: 'vectorParam',
        type: 'vector',
        defaultValue: { x: 1, y: 2, z: 3 },
        category: 'physics'
      };

      const colorParam: IParameterDefinition = {
        name: 'colorParam',
        type: 'color',
        defaultValue: '#ff0000',
        category: 'visual'
      };

      manager.registerParameter('testAlg', numberParam);
      manager.registerParameter('testAlg', booleanParam);
      manager.registerParameter('testAlg', enumParam);
      manager.registerParameter('testAlg', vectorParam);
      manager.registerParameter('testAlg', colorParam);
    });

    describe('Number Validation', () => {
      it('should accept valid numbers', () => {
        expect(manager.validateParameter('testAlg', 'numberParam', 50)).toBe(true);
        expect(manager.validateParameter('testAlg', 'numberParam', 0)).toBe(true);
        expect(manager.validateParameter('testAlg', 'numberParam', 100)).toBe(true);
      });

      it('should reject invalid number types', () => {
        expect(manager.validateParameter('testAlg', 'numberParam', 'string')).toBe('Value must be a valid number');
        expect(manager.validateParameter('testAlg', 'numberParam', true)).toBe('Value must be a valid number');
        expect(manager.validateParameter('testAlg', 'numberParam', NaN)).toBe('Value must be a valid number');
      });

      it('should respect min/max constraints', () => {
        expect(manager.validateParameter('testAlg', 'numberParam', -1)).toBe('Value must be >= 0');
        expect(manager.validateParameter('testAlg', 'numberParam', 101)).toBe('Value must be <= 100');
      });
    });

    describe('Boolean Validation', () => {
      it('should accept valid booleans', () => {
        expect(manager.validateParameter('testAlg', 'booleanParam', true)).toBe(true);
        expect(manager.validateParameter('testAlg', 'booleanParam', false)).toBe(true);
      });

      it('should reject non-boolean values', () => {
        expect(manager.validateParameter('testAlg', 'booleanParam', 'true')).toBe('Value must be a boolean');
        expect(manager.validateParameter('testAlg', 'booleanParam', 1)).toBe('Value must be a boolean');
        expect(manager.validateParameter('testAlg', 'booleanParam', null)).toBe('Value must be a boolean');
      });
    });

    describe('Enum Validation', () => {
      it('should accept valid enum values', () => {
        expect(manager.validateParameter('testAlg', 'enumParam', 'option1')).toBe(true);
        expect(manager.validateParameter('testAlg', 'enumParam', 'option2')).toBe(true);
        expect(manager.validateParameter('testAlg', 'enumParam', 'option3')).toBe(true);
      });

      it('should reject invalid enum values', () => {
        const result = manager.validateParameter('testAlg', 'enumParam', 'invalid');
        expect(result).toBe('Value must be one of: option1, option2, option3');
      });
    });

    describe('Vector Validation', () => {
      it('should accept valid vectors', () => {
        expect(manager.validateParameter('testAlg', 'vectorParam', { x: 1, y: 2, z: 3 })).toBe(true);
        expect(manager.validateParameter('testAlg', 'vectorParam', { x: 0, y: 0, z: 0 })).toBe(true);
        expect(manager.validateParameter('testAlg', 'vectorParam', { x: -1, y: 2.5, z: -3.7 })).toBe(true);
      });

      it('should reject invalid vector objects', () => {
        expect(manager.validateParameter('testAlg', 'vectorParam', null)).toBe('Vector must be an object');
        expect(manager.validateParameter('testAlg', 'vectorParam', 'string')).toBe('Vector must be an object');
        expect(manager.validateParameter('testAlg', 'vectorParam', { x: 1, y: 2 })).toBe('Vector.z must be a valid number');
        expect(manager.validateParameter('testAlg', 'vectorParam', { x: 'invalid', y: 2, z: 3 })).toBe('Vector.x must be a valid number');
      });
    });

    describe('Color Validation', () => {
      it('should accept valid hex colors', () => {
        expect(manager.validateParameter('testAlg', 'colorParam', '#ff0000')).toBe(true);
        expect(manager.validateParameter('testAlg', 'colorParam', '#00FF00')).toBe(true);
        expect(manager.validateParameter('testAlg', 'colorParam', '#0000ff')).toBe(true);
      });

      it('should accept valid color numbers', () => {
        expect(manager.validateParameter('testAlg', 'colorParam', 0xff0000)).toBe(true);
        expect(manager.validateParameter('testAlg', 'colorParam', 0x00ff00)).toBe(true);
        expect(manager.validateParameter('testAlg', 'colorParam', 0)).toBe(true);
        expect(manager.validateParameter('testAlg', 'colorParam', 0xffffff)).toBe(true);
      });

      it('should reject invalid colors', () => {
        expect(manager.validateParameter('testAlg', 'colorParam', '#invalid')).toBe('Color must be a valid hex string (#RRGGBB)');
        expect(manager.validateParameter('testAlg', 'colorParam', 'red')).toBe('Color must be a valid hex string (#RRGGBB)');
        expect(manager.validateParameter('testAlg', 'colorParam', -1)).toBe('Color number must be between 0 and 0xFFFFFF');
        expect(manager.validateParameter('testAlg', 'colorParam', 0x1000000)).toBe('Color number must be between 0 and 0xFFFFFF');
      });
    });

    it('should reject validation for unknown parameters', () => {
      const result = manager.validateParameter('testAlg', 'unknown', 'value');
      expect(result).toBe('Parameter unknown not found for algorithm testAlg');
    });
  });

  describe('Parameter Value Management', () => {
    const testParam: IParameterDefinition = {
      name: 'testParam',
      type: 'number',
      defaultValue: 42,
      category: 'physics',
      constraints: { min: 0, max: 100 }
    };

    beforeEach(() => {
      manager.registerParameter('testAlg', testParam);
    });

    it('should set valid parameter values', () => {
      manager.setParameter('testAlg', 'testParam', 75);

      expect(manager.getParameterValue('testAlg', 'testParam')).toBe(75);
    });

    it('should reject invalid parameter values', () => {
      expect(() => {
        manager.setParameter('testAlg', 'testParam', 150); // Above max
      }).toThrow('Invalid parameter value');
    });

    it('should get all parameter values for algorithm', () => {
      const param2: IParameterDefinition = {
        name: 'param2', type: 'boolean', defaultValue: false, category: 'visual'
      };
      manager.registerParameter('testAlg', param2);
      manager.setParameter('testAlg', 'testParam', 25);

      const values = manager.getParameterValues('testAlg');

      expect(values).toEqual({
        testParam: 25,
        param2: false
      });
    });

    it('should reset parameter to default value', () => {
      manager.setParameter('testAlg', 'testParam', 75);
      expect(manager.getParameterValue('testAlg', 'testParam')).toBe(75);

      manager.resetParameter('testAlg', 'testParam');
      expect(manager.getParameterValue('testAlg', 'testParam')).toBe(42);
    });

    it('should reset all parameters for algorithm', () => {
      const param2: IParameterDefinition = {
        name: 'param2', type: 'boolean', defaultValue: true, category: 'visual'
      };
      manager.registerParameter('testAlg', param2);

      manager.setParameter('testAlg', 'testParam', 75);
      manager.setParameter('testAlg', 'param2', false);

      manager.resetParameters('testAlg');

      expect(manager.getParameterValue('testAlg', 'testParam')).toBe(42);
      expect(manager.getParameterValue('testAlg', 'param2')).toBe(true);
    });
  });

  describe('Parameter Organization', () => {
    beforeEach(() => {
      const physicsParams: IParameterDefinition[] = [
        { name: 'gravity', type: 'number', defaultValue: -9.81, category: 'physics' },
        { name: 'damping', type: 'number', defaultValue: 0.98, category: 'physics' }
      ];

      const visualParams: IParameterDefinition[] = [
        { name: 'color', type: 'color', defaultValue: '#ff0000', category: 'visual' },
        { name: 'wireframe', type: 'boolean', defaultValue: false, category: 'visual' }
      ];

      const algorithmParams: IParameterDefinition[] = [
        { name: 'method', type: 'enum', defaultValue: 'verlet', category: 'algorithm', constraints: { options: ['euler', 'verlet', 'rk4'] } }
      ];

      [...physicsParams, ...visualParams, ...algorithmParams].forEach(param => {
        manager.registerParameter('testAlg', param);
      });
    });

    it('should group parameters by category', () => {
      const categorized = manager.getParametersByCategory('testAlg');

      expect(categorized.get('physics')).toHaveLength(2);
      expect(categorized.get('visual')).toHaveLength(2);
      expect(categorized.get('algorithm')).toHaveLength(1);

      expect(categorized.get('physics')?.map((p: IParameterDefinition) => p.name)).toEqual(['gravity', 'damping']);
      expect(categorized.get('visual')?.map((p: IParameterDefinition) => p.name)).toEqual(['color', 'wireframe']);
      expect(categorized.get('algorithm')?.map((p: IParameterDefinition) => p.name)).toEqual(['method']);
    });
  });

  describe('Parameter Change Listeners', () => {
    const testParam: IParameterDefinition = {
      name: 'testParam', type: 'number', defaultValue: 10, category: 'physics'
    };
    let listener: jest.Mock;

    beforeEach(() => {
      manager.registerParameter('testAlg', testParam);
      listener = jest.fn();
      manager.addParameterChangeListener('testAlg', listener);
    });

    it('should notify listeners on parameter change', () => {
      manager.setParameter('testAlg', 'testParam', 25);

      expect(listener).toHaveBeenCalledWith('testAlg', 'testParam', 25);
    });

    it('should not notify listeners for other algorithms', () => {
      manager.registerParameter('otherAlg', testParam);
      manager.addParameterChangeListener('otherAlg', listener);

      manager.setParameter('testAlg', 'testParam', 25);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith('testAlg', 'testParam', 25);
    });

    it('should allow removing listeners', () => {
      manager.removeParameterChangeListener('testAlg', listener);
      manager.setParameter('testAlg', 'testParam', 25);

      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle listener exceptions gracefully', () => {
      const throwingListener = jest.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });
      manager.addParameterChangeListener('testAlg', throwingListener);

      expect(() => {
        manager.setParameter('testAlg', 'testParam', 25);
      }).not.toThrow();

      expect(throwingListener).toHaveBeenCalled();
    });
  });

  describe('Statistics', () => {
    it('should provide accurate statistics', () => {
      // Add parameters for multiple algorithms
      const param1: IParameterDefinition = { name: 'p1', type: 'number', defaultValue: 1, category: 'physics' };
      const param2: IParameterDefinition = { name: 'p2', type: 'boolean', defaultValue: true, category: 'visual' };
      const param3: IParameterDefinition = { name: 'p3', type: 'enum', defaultValue: 'a', category: 'algorithm', constraints: { options: ['a', 'b'] } };

      manager.registerParameter('alg1', param1);
      manager.registerParameter('alg1', param2);
      manager.registerParameter('alg2', param3);

      const stats = manager.getStats();

      expect(stats.algorithmCount).toBe(2);
      expect(stats.totalParameters).toBe(3);
      expect(stats.parametersByCategory.physics).toBe(1);
      expect(stats.parametersByCategory.visual).toBe(1);
      expect(stats.parametersByCategory.algorithm).toBe(1);
    });

    it('should handle empty state statistics', () => {
      const stats = manager.getStats();

      expect(stats.algorithmCount).toBe(0);
      expect(stats.totalParameters).toBe(0);
      expect(stats.parametersByCategory).toEqual({});
    });
  });
});
