/**
 * SimulationState Test Suite
 * 
 * TDD: Writing tests first to define expected behavior
 */

import { SimulationState } from '../SimulationState';
import { EntityId } from '../interfaces';

describe('SimulationState', () => {
  describe('Creation', () => {
    it('should create initial empty state', () => {
      const state = SimulationState.createInitial();
      
      expect(state.entities.size).toBe(0);
      expect(state.time).toBe(0);
      expect(state.deltaTime).toBe(0);
      expect(state.isRunning).toBe(false);
      expect(state.metadata.size).toBe(0);
      expect(state.isEmpty()).toBe(true);
    });

    it('should create state from minimal data', () => {
      const entities: EntityId[] = [1, 2, 3];
      const state = SimulationState.create(entities, 10.5, 0.016, true, { test: 'value' });
      
      expect(state.entities.size).toBe(3);
      expect(state.hasEntity(1)).toBe(true);
      expect(state.hasEntity(2)).toBe(true);
      expect(state.hasEntity(3)).toBe(true);
      expect(state.hasEntity(4)).toBe(false);
      expect(state.time).toBe(10.5);
      expect(state.deltaTime).toBe(0.016);
      expect(state.isRunning).toBe(true);
      expect(state.getMetadata('test')).toBe('value');
      expect(state.isEmpty()).toBe(false);
    });
  });

  describe('Immutable Updates', () => {
    let originalState: SimulationState;

    beforeEach(() => {
      originalState = SimulationState.create([1, 2], 5.0, 0.02, false, { original: true });
    });

    it('should create new state with updated entities', () => {
      const newEntities = new Set<EntityId>([3, 4, 5]);
      const newState = originalState.withEntities(newEntities);
      
      // Original unchanged
      expect(originalState.entities.size).toBe(2);
      expect(originalState.hasEntity(1)).toBe(true);
      
      // New state has updates
      expect(newState.entities.size).toBe(3);
      expect(newState.hasEntity(3)).toBe(true);
      expect(newState.hasEntity(1)).toBe(false);
      
      // Other properties preserved
      expect(newState.time).toBe(5.0);
      expect(newState.deltaTime).toBe(0.02);
      expect(newState.isRunning).toBe(false);
    });

    it('should create new state with updated time', () => {
      const newState = originalState.withTime(15.5, 0.033);
      
      // Original unchanged
      expect(originalState.time).toBe(5.0);
      expect(originalState.deltaTime).toBe(0.02);
      
      // New state has updates
      expect(newState.time).toBe(15.5);
      expect(newState.deltaTime).toBe(0.033);
      
      // Other properties preserved
      expect(newState.entities.size).toBe(2);
      expect(newState.isRunning).toBe(false);
    });

    it('should create new state with updated running status', () => {
      const newState = originalState.withRunning(true);
      
      // Original unchanged
      expect(originalState.isRunning).toBe(false);
      
      // New state has updates
      expect(newState.isRunning).toBe(true);
      
      // Other properties preserved
      expect(newState.time).toBe(5.0);
      expect(newState.entities.size).toBe(2);
    });

    it('should create new state with added metadata', () => {
      const newState = originalState.withAddedMetadata('new-key', 'new-value');
      
      // Original unchanged
      expect(originalState.hasMetadata('new-key')).toBe(false);
      
      // New state has updates
      expect(newState.hasMetadata('new-key')).toBe(true);
      expect(newState.getMetadata('new-key')).toBe('new-value');
      expect(newState.hasMetadata('original')).toBe(true);
      
      // Other properties preserved
      expect(newState.time).toBe(5.0);
      expect(newState.entities.size).toBe(2);
    });

    it('should create new state with replaced metadata', () => {
      const newMetadata = new Map([['replaced', 'metadata']]);
      const newState = originalState.withMetadata(newMetadata);
      
      // Original unchanged
      expect(originalState.hasMetadata('original')).toBe(true);
      
      // New state has updates
      expect(newState.hasMetadata('replaced')).toBe(true);
      expect(newState.hasMetadata('original')).toBe(false);
      
      // Other properties preserved
      expect(newState.time).toBe(5.0);
      expect(newState.entities.size).toBe(2);
    });
  });

  describe('Entity Management', () => {
    let state: SimulationState;

    beforeEach(() => {
      state = SimulationState.create([10, 20, 30]);
    });

    it('should check entity existence', () => {
      expect(state.hasEntity(10)).toBe(true);
      expect(state.hasEntity(20)).toBe(true);
      expect(state.hasEntity(30)).toBe(true);
      expect(state.hasEntity(40)).toBe(false);
    });

    it('should return entities as array', () => {
      const entities = state.getEntityArray();
      
      expect(entities).toHaveLength(3);
      expect(entities).toContain(10);
      expect(entities).toContain(20);
      expect(entities).toContain(30);
      expect(entities).not.toContain(40);
    });

    it('should report correct empty status', () => {
      expect(state.isEmpty()).toBe(false);
      
      const emptyState = SimulationState.createInitial();
      expect(emptyState.isEmpty()).toBe(true);
    });
  });

  describe('Metadata Management', () => {
    let state: SimulationState;

    beforeEach(() => {
      state = SimulationState.create([], 0, 0, false, {
        stringValue: 'test',
        numberValue: 42,
        booleanValue: true,
        objectValue: { nested: 'data' }
      });
    });

    it('should get typed metadata values', () => {
      expect(state.getMetadata<string>('stringValue')).toBe('test');
      expect(state.getMetadata<number>('numberValue')).toBe(42);
      expect(state.getMetadata<boolean>('booleanValue')).toBe(true);
      expect(state.getMetadata<any>('objectValue')).toEqual({ nested: 'data' });
      expect(state.getMetadata('nonexistent')).toBeUndefined();
    });

    it('should check metadata existence', () => {
      expect(state.hasMetadata('stringValue')).toBe(true);
      expect(state.hasMetadata('numberValue')).toBe(true);
      expect(state.hasMetadata('nonexistent')).toBe(false);
    });

    it('should return metadata as plain object', () => {
      const metadataObj = state.getMetadataObject();
      
      expect(metadataObj).toEqual({
        stringValue: 'test',
        numberValue: 42,
        booleanValue: true,
        objectValue: { nested: 'data' }
      });
    });
  });

  describe('String Representation', () => {
    it('should provide meaningful toString', () => {
      const state = SimulationState.create([1, 2, 3], 12.345, 0.016, true);
      const str = state.toString();
      
      expect(str).toContain('entities: [1, 2, 3]');
      expect(str).toContain('time: 12.345');
      expect(str).toContain('running: true');
    });

    it('should handle empty state toString', () => {
      const state = SimulationState.createInitial();
      const str = state.toString();
      
      expect(str).toContain('entities: []');
      expect(str).toContain('time: 0.000');
      expect(str).toContain('running: false');
    });
  });

  describe('Immutability Guarantees', () => {
    it('should provide readonly interface for entities', () => {
      const state = SimulationState.create([1, 2, 3]);
      
      // TypeScript should prevent this at compile time
      // At runtime, the Set is still mutable but we trust TypeScript
      expect(state.entities.size).toBe(3);
      expect(state.entities.has(1)).toBe(true);
    });

    it('should provide readonly interface for metadata', () => {
      const state = SimulationState.create([], 0, 0, false, { test: 'value' });
      
      // TypeScript should prevent this at compile time
      // At runtime, the Map is still mutable but we trust TypeScript
      expect(state.metadata.size).toBe(1);
      expect(state.metadata.has('test')).toBe(true);
    });

    it('should create completely independent instances', () => {
      const state1 = SimulationState.create([1, 2], 5.0, 0.02, false, { shared: 'data' });
      const state2 = state1.withTime(10.0, 0.04);
      const state3 = state2.withEntities(new Set([3, 4]));
      
      // All states should be independent
      expect(state1.time).toBe(5.0);
      expect(state1.entities.size).toBe(2);
      
      expect(state2.time).toBe(10.0);
      expect(state2.entities.size).toBe(2);
      
      expect(state3.time).toBe(10.0);
      expect(state3.entities.size).toBe(2);
    });
  });
});
