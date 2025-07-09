# Entity Component System (ECS)

This directory contains the implementation of the Entity Component System (ECS) architecture for the Physics Simulation Studio.

## Overview

The ECS architecture is a design pattern that promotes composition over inheritance. It consists of three main parts:

1. **Entities**: Simple identifiers (numbers in our implementation) that represent objects in the simulation.
2. **Components**: Data containers that define the properties and state of entities.
3. **Systems**: Logic that operates on entities with specific components.

## Key Classes

### Component

The `Component` abstract class serves as the base for all components in the system. It provides:

- Standardized interface for all components
- Serialization and deserialization methods
- Type identification through static `type` property
- Deep cloning through the `clone()` method

Example of a component:

```typescript
class PositionComponent extends Component<PositionComponent> {
  static readonly type: string = "PositionComponent";
  
  public x: number;
  public y: number;
  public z: number;
  
  constructor(x = 0, y = 0, z = 0) {
    super();
    this.x = x;
    this.y = y;
    this.z = z;
  }
  
  clone(): PositionComponent {
    return new PositionComponent(this.x, this.y, this.z);
  }
}
```

### ComponentRegistry

The `ComponentRegistry` is a singleton that manages component type registration. It provides:

- Type-safe registration of component constructors
- Component instance creation by type
- Type checking and validation

Example usage:

```typescript
const registry = ComponentRegistry.getInstance();
registry.register(PositionComponent);

// Create a component by type
const position = registry.createComponent<PositionComponent>('PositionComponent', 10, 20, 30);
```

### ComponentManager

The `ComponentManager` manages component storage and retrieval for entities. It provides:

- Component registration, addition, and removal
- Entity querying based on component types
- Batch operations for improved performance
- Efficient component storage using Maps

Example usage:

```typescript
const componentManager = new ComponentManager();
componentManager.registerComponent(PositionComponent);

// Add a component to an entity
componentManager.addComponent(entityId, PositionComponent.type, new PositionComponent(10, 20, 30));

// Get a component from an entity
const position = componentManager.getComponent<PositionComponent>(entityId, PositionComponent.type);

// Find entities with specific components
const entities = componentManager.getEntitiesWithComponents([PositionComponent, RenderableComponent]);

// Perform a batch operation
componentManager.batchOperation(entities, (entityId) => {
  const position = componentManager.getComponent<PositionComponent>(entityId, PositionComponent.type);
  if (position) {
    position.x += 10;
  }
});
```

### EntityManager

The `EntityManager` is responsible for creating and managing entities. It provides:

- Entity creation and destruction
- Entity ID recycling for memory efficiency
- Entity existence checking

### SystemManager

The `SystemManager` manages and executes systems. It provides:

- System registration and prioritization
- System execution in priority order
- Update cycle management

### World

The `World` class ties everything together, providing a facade for the ECS system. It manages:

- Entity creation and destruction
- Component addition and removal
- System registration and execution
- The main update loop

## Performance Optimizations

The ECS implementation includes several performance optimizations:

1. **Efficient Component Storage**: Components are stored in type-specific Maps for O(1) access.
2. **Batch Operations**: The `batchOperation` method allows performing operations on multiple entities efficiently.
3. **Component Pooling**: (TODO) Implement object pooling for frequently created/destroyed components.
4. **Entity ID Recycling**: Entity IDs are reused to prevent memory fragmentation.
5. **Optimized Queries**: Entity queries are optimized to start with the smallest component collection.

## Error Handling

The implementation includes robust error handling:

1. **Type Validation**: Component types are validated during registration.
2. **Existence Checks**: Methods check for the existence of entities and components.
3. **Clear Error Messages**: Error messages provide clear information about what went wrong.
4. **Defensive Programming**: Methods include checks to prevent invalid operations.

## Future Improvements

Potential future improvements include:

1. **Worker Thread Support**: Move computationally intensive operations to worker threads.
2. **Memory Optimization**: Further optimize memory usage for large simulations.
3. **Query Caching**: Cache query results for frequently used queries.
4. **Component Archetypes**: Group entities with the same component types for faster iteration.
