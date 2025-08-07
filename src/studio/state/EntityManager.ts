/**
 * Entity Manager - Sophisticated entity lifecycle management with global state integration
 * This adds advanced entity management to your physics simulation studio
 */

import { getGlobalStore } from './GlobalStore';
import { Actions } from './Actions';
import { EntitySelectors } from './Selectors';
import { getErrorManager } from './ErrorManager';
import { Logger } from '../../core/utils/Logger';

// Define Entity and Component interfaces for the entity manager
export interface Component {
  type: string;
  data?: any;
}

export interface Entity {
  id: string;
  components: Map<string, Component>;
}

export interface EntityMetadata {
  createdAt: number;
  lastModified: number;
  tags: Set<string>;
  description?: string;
  category?: string;
}

export interface EntitySnapshot {
  entityId: string;
  components: Component[];
  metadata: EntityMetadata;
  timestamp: number;
}

export class EntityManager {
  private static instance: EntityManager | null = null;
  private readonly logger = Logger.getInstance();
  private readonly errorManager = getErrorManager();

  // Entity cache for performance
  private entityCache = new Map<string, Entity>();
  private metadataCache = new Map<string, EntityMetadata>();

  private constructor() {}

  public static getInstance(): EntityManager {
    if (!EntityManager.instance) {
      EntityManager.instance = new EntityManager();
    }
    return EntityManager.instance;
  }

  /**
   * Create a new entity with automatic state management
   */
  createEntity(
    entityId: string,
    initialComponents: Component[] = [],
    metadata: Partial<EntityMetadata> = {}
  ): Entity {
    try {
      const entity: Entity = {
        id: entityId,
        components: new Map()
      };

      // Add components
      initialComponents.forEach(component => {
        entity.components.set(component.type, component);
      });

      // Create metadata
      const fullMetadata: EntityMetadata = {
        createdAt: Date.now(),
        lastModified: Date.now(),
        tags: new Set(metadata.tags || []),
        description: metadata.description,
        category: metadata.category || 'general'
      };

      // Cache entity and metadata
      this.entityCache.set(entityId, entity);
      this.metadataCache.set(entityId, fullMetadata);

      // Update global state
      const store = getGlobalStore();
      store.dispatch(Actions.entityCreated(entityId, initialComponents.map(c => c.type)));

      this.logger.debug(`Created entity: ${entityId}`, { entity, metadata: fullMetadata });

      return entity;
    } catch (error) {
      this.errorManager.reportError(
        `Failed to create entity: ${entityId}`,
        'error',
        { source: 'EntityManager', action: 'createEntity', additionalData: { entityId, error } }
      );
      throw error;
    }
  }

  /**
   * Update an entity's components
   */
  updateEntity(entityId: string, components: Component[]): void {
    try {
      const entity = this.entityCache.get(entityId);
      if (!entity) {
        throw new Error(`Entity not found: ${entityId}`);
      }

      // Update components
      components.forEach(component => {
        entity.components.set(component.type, component);
      });

      // Update metadata
      const metadata = this.metadataCache.get(entityId);
      if (metadata) {
        metadata.lastModified = Date.now();
      }

      // Update global state (Note: No direct entity update action, so we use created action)
      const store = getGlobalStore();
      // Since there's no entityUpdated action, we'll just log the update

      this.logger.debug(`Updated entity: ${entityId}`, { components });
    } catch (error) {
      this.errorManager.reportError(
        `Failed to update entity: ${entityId}`,
        'error',
        { source: 'EntityManager', action: 'updateEntity', additionalData: { entityId, error } }
      );
      throw error;
    }
  }

  /**
   * Delete an entity
   */
  deleteEntity(entityId: string): void {
    try {
      // Remove from cache
      this.entityCache.delete(entityId);
      this.metadataCache.delete(entityId);

      // Update global state
      const store = getGlobalStore();
      store.dispatch(Actions.entityDestroyed(entityId));

      this.logger.debug(`Deleted entity: ${entityId}`);
    } catch (error) {
      this.errorManager.reportError(
        `Failed to delete entity: ${entityId}`,
        'error',
        { source: 'EntityManager', action: 'deleteEntity', additionalData: { entityId, error } }
      );
      throw error;
    }
  }

  /**
   * Get entity by ID
   */
  getEntity(entityId: string): Entity | null {
    return this.entityCache.get(entityId) || null;
  }

  /**
   * Get entity metadata
   */
  getEntityMetadata(entityId: string): EntityMetadata | null {
    return this.metadataCache.get(entityId) || null;
  }

  /**
   * Select/deselect entities
   */
  selectEntity(entityId: string, selected = true): void {
    try {
      const store = getGlobalStore();

      if (selected) {
        store.dispatch(Actions.entitySelected(entityId));
      } else {
        store.dispatch(Actions.entitySelected(null)); // Deselect by selecting null
      }

      this.logger.debug(`${selected ? 'Selected' : 'Deselected'} entity: ${entityId}`);
    } catch (error) {
      this.errorManager.reportError(
        `Failed to ${selected ? 'select' : 'deselect'} entity: ${entityId}`,
        'error',
        { source: 'EntityManager', action: 'selectEntity', additionalData: { entityId, selected, error } }
      );
    }
  }

  /**
   * Toggle entity visibility
   */
  toggleEntityVisibility(entityId: string, visible?: boolean): void {
    try {
      const store = getGlobalStore();
      const state = store.getState();
      const entity = EntitySelectors.getAllEntities(state).find(e => e.id === entityId);
      const currentVisibility = entity ? entity.isVisible : true;
      const newVisibility = visible !== undefined ? visible : !currentVisibility;

      store.dispatch(Actions.entityVisibilityChanged(entityId, newVisibility));

      this.logger.debug(`Changed entity visibility: ${entityId} -> ${newVisibility}`);
    } catch (error) {
      this.errorManager.reportError(
        `Failed to toggle visibility for entity: ${entityId}`,
        'error',
        { source: 'EntityManager', action: 'toggleEntityVisibility', additionalData: { entityId, visible, error } }
      );
    }
  }

  /**
   * Add tags to an entity
   */
  addEntityTags(entityId: string, tags: string[]): void {
    try {
      const metadata = this.metadataCache.get(entityId);
      if (!metadata) {
        throw new Error(`Entity metadata not found: ${entityId}`);
      }

      tags.forEach(tag => metadata.tags.add(tag));
      metadata.lastModified = Date.now();

      this.logger.debug(`Added tags to entity: ${entityId}`, { tags });
    } catch (error) {
      this.errorManager.reportError(
        `Failed to add tags to entity: ${entityId}`,
        'error',
        { source: 'EntityManager', action: 'addEntityTags', additionalData: { entityId, tags, error } }
      );
    }
  }

  /**
   * Remove tags from an entity
   */
  removeEntityTags(entityId: string, tags: string[]): void {
    try {
      const metadata = this.metadataCache.get(entityId);
      if (!metadata) {
        throw new Error(`Entity metadata not found: ${entityId}`);
      }

      tags.forEach(tag => metadata.tags.delete(tag));
      metadata.lastModified = Date.now();

      this.logger.debug(`Removed tags from entity: ${entityId}`, { tags });
    } catch (error) {
      this.errorManager.reportError(
        `Failed to remove tags from entity: ${entityId}`,
        'error',
        { source: 'EntityManager', action: 'removeEntityTags', additionalData: { entityId, tags, error } }
      );
    }
  }

  /**
   * Find entities by tag
   */
  findEntitiesByTag(tag: string): Entity[] {
    const entities: Entity[] = [];

    for (const [entityId, metadata] of this.metadataCache) {
      if (metadata.tags.has(tag)) {
        const entity = this.entityCache.get(entityId);
        if (entity) {
          entities.push(entity);
        }
      }
    }

    return entities;
  }

  /**
   * Find entities by category
   */
  findEntitiesByCategory(category: string): Entity[] {
    const entities: Entity[] = [];

    for (const [entityId, metadata] of this.metadataCache) {
      if (metadata.category === category) {
        const entity = this.entityCache.get(entityId);
        if (entity) {
          entities.push(entity);
        }
      }
    }

    return entities;
  }

  /**
   * Get all entities
   */
  getAllEntities(): Entity[] {
    return Array.from(this.entityCache.values());
  }

  /**
   * Get entity count
   */
  getEntityCount(): number {
    return this.entityCache.size;
  }

  /**
   * Create entity snapshot for undo/redo
   */
  createEntitySnapshot(entityId: string): EntitySnapshot | null {
    try {
      const entity = this.entityCache.get(entityId);
      const metadata = this.metadataCache.get(entityId);

      if (!entity || !metadata) {
        return null;
      }

      return {
        entityId,
        components: Array.from(entity.components.values()),
        metadata: { ...metadata, tags: new Set(metadata.tags) },
        timestamp: Date.now()
      };
    } catch (error) {
      this.errorManager.reportError(
        `Failed to create snapshot for entity: ${entityId}`,
        'error',
        { source: 'EntityManager', action: 'createEntitySnapshot', additionalData: { entityId, error } }
      );
      return null;
    }
  }

  /**
   * Restore entity from snapshot
   */
  restoreEntitySnapshot(snapshot: EntitySnapshot): void {
    try {
      // Create entity from snapshot
      const entity: Entity = {
        id: snapshot.entityId,
        components: new Map()
      };

      snapshot.components.forEach(component => {
        entity.components.set(component.type, component);
      });

      // Restore to caches
      this.entityCache.set(snapshot.entityId, entity);
      this.metadataCache.set(snapshot.entityId, snapshot.metadata);

      // Update global state (re-create entity since no direct update action)
      const store = getGlobalStore();
      store.dispatch(Actions.entityCreated(snapshot.entityId, snapshot.components.map(c => c.type)));

      this.logger.debug(`Restored entity from snapshot: ${snapshot.entityId}`, { snapshot });
    } catch (error) {
      this.errorManager.reportError(
        `Failed to restore entity snapshot: ${snapshot.entityId}`,
        'error',
        { source: 'EntityManager', action: 'restoreEntitySnapshot', additionalData: { snapshot, error } }
      );
      throw error;
    }
  }

  /**
   * Clear all entities
   */
  clearAllEntities(): void {
    try {
      const entityIds = Array.from(this.entityCache.keys());

      // Clear caches
      this.entityCache.clear();
      this.metadataCache.clear();

      // Update global state
      const store = getGlobalStore();
      entityIds.forEach(entityId => {
        store.dispatch(Actions.entityDestroyed(entityId));
      });

      this.logger.debug('Cleared all entities', { count: entityIds.length });
    } catch (error) {
      this.errorManager.reportError(
        'Failed to clear all entities',
        'error',
        { source: 'EntityManager', action: 'clearAllEntities', additionalData: { error } }
      );
      throw error;
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    entityCount: number;
    cacheMemoryUsage: number;
    averageComponentsPerEntity: number;
  } {
    const entityCount = this.entityCache.size;
    const totalComponents = Array.from(this.entityCache.values())
      .reduce((sum, entity) => sum + entity.components.size, 0);

    // Rough estimate of cache memory usage
    const cacheMemoryUsage = entityCount * 1000 + // Approximate bytes per entity
      Array.from(this.metadataCache.values()).length * 500; // Approximate bytes per metadata

    return {
      entityCount,
      cacheMemoryUsage,
      averageComponentsPerEntity: entityCount > 0 ? totalComponents / entityCount : 0
    };
  }
}

/**
 * Convenience function to get the entity manager
 */
export function getEntityManager(): EntityManager {
  return EntityManager.getInstance();
}
