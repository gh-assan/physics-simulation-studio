# Physics Simulation Studio - Interfaces Overview

This document presents the optimal set of interfaces for the Physics Simulation Studio. The goal is to maximize modularity, extensibility, and maintainability, while minimizing unnecessary complexity. Interfaces are chosen to support core architectural boundaries and future growth, but only where abstraction is truly needed.

## Architectural Notes & Improvement Suggestions

- **Minimalism:** Only include interfaces that enable modularity, extensibility, or testability. Avoid abstraction for its own sake.
- **Domain Boundaries:** Each interface represents a major architectural boundary (simulation, rendering, plugin, UI, event, physics).
- **Merge & Simplify:** ECS management is unified in `IECSManager`. UI is abstracted only where future framework changes are likely. Physics and plugin systems are abstracted for swappability and extensibility.
- **Base Abstractions:** Use `IDisposable` and `IInitializable` only if lifecycle management is needed.
- **Extensibility:** Add new interfaces only when new features (serialization, undo/redo, etc.) are required.

## Interface Groups

### Essential Interfaces

#### 1. Simulation Core
* `IStudio` — Facade for the main application context. Provides access to graphics, ECS, and plugin context.
* `IECSManager` — Unified manager for entities, components, and registry operations.
* `ISystemManager` — Manages system registration and updates.
* `IWorld` — ECS world context (can be merged with IECSManager if desired).
* `IComponent` — Marker interface for ECS components.

#### 2. Plugin System

* `IPluginManager` — Manages simulation plugins (registration, activation, deactivation).
* `ISimulationPlugin` — Contract for simulation plugins (lifecycle, dependencies, systems, UI panels).
* `IPluginContext` — Aggregates access for plugins (studio, world, event bus, etc.).

---

### Plugin Interfaces (Recommended for Simulation Plugins)

#### 1. `ISimulationPlugin`
*   **Purpose:** Main contract for all simulation plugins.
*   **Key Methods:**
    *   `getName(): string`
    *   `getDependencies(): string[]`
    *   `register(world: IWorld): void`
    *   `unregister(): void`
    *   `initializeEntities(world: IWorld): void`
    *   `getSystems(studio: IStudio): System[]`
    *   `getParameterPanels?(world: IWorld): ParameterPanelComponent[]`

#### 2. `IAlgorithm`
*   **Purpose:** Abstracts the simulation logic/algorithm for a plugin.
*   **Key Methods:**
    *   `step(deltaTime: number): void`
    *   `initialize(world: IWorld): void`
    *   `reset(): void` (optional)

#### 3. `IRenderable`
*   **Purpose:** Abstracts rendering for plugin-specific visuals.
*   **Key Methods:**
    *   `render(graphics: IGraphicsManager): void`
    *   `dispose(): void` (optional)

---

#### 3. Rendering & Graphics
* `IGraphicsManager` — Abstracts the 3D rendering library. Manages scene, camera, and rendering operations.

#### 4. Physics
* `IPhysicsEngine` — Abstracts physics calculations, enables engine swapping and testability.
* `IRigidBody` — Abstracts rigid body representation.

#### 5. UI (Minimal)
* `IUIManager` — Abstracts creation and management of UI elements.
* `IPanel` — Generic UI panel interface (can extend `IDisposable` if needed).

#### 6. Events & Utilities
* `IApplicationEventBus` — Application-level event bus.
* `ILogger` — Logging utility.

#### 7. Lifecycle (Optional)
* `IDisposable` — For cleanup.
* `IInitializable` — For initialization.

#### 8. Extension Points (Add only if needed)
* `ISimulationSerializer` — For simulation serialization/deserialization.
* `IUndoManager` — For undo/redo functionality.


## Core Interfaces (Currently Implemented/Refactored)

### 1. `IStudio`
*   **Purpose:** Facade for the main application context. Provides access to graphics, ECS, and plugin context.
*   **Key Methods:**
    *   `getGraphicsManager(): IGraphicsManager`
    *   `getWorld(): IWorld`
    *   `getPluginContext(): IPluginContext`

### 2. `IECSManager`
*   **Purpose:** Unified manager for entities, components, and registry operations.
*   **Key Methods:**
    *   `createEntity(id?: number): number`
    *   `destroyEntity(entityId: number): void`
    *   `hasEntity(entityId: number): boolean`
    *   `registerComponent<T extends IComponent>(componentClass: new (...args: any[]) => T): void`
    *   `addComponent<T extends IComponent>(entityID: number, componentType: string, component: T): void`
    *   `getComponent<T extends IComponent>(entityID: number, componentType: string): T | undefined`
    *   `removeComponent(entityID: number, componentType: string): void`
    *   `getEntitiesWithComponentTypes(componentTypes: string[]): number[]`
    *   `getAllComponentsForEntity(entityID: number): { [key: string]: IComponent; }`
    *   `updateComponent<T extends IComponent>(entityID: number, componentType: string, newComponent: T): void`
    *   `clear(): void`
    *   `getComponentConstructors(): Map<string, new (...args: any[]) => IComponent>`

### 3. `ISystemManager`
*   **Purpose:** Manages system registration and updates.
*   **Key Methods:**
    *   `registerSystem(system: System): void`
    *   `onSystemRegistered(callback: (system: System) => void): void`
    *   `updateAll(deltaTime: number): void`
    *   `getSystem<T extends System>(systemType: new (...args: any[]) => T): T | undefined`
    *   `removeSystem(system: System): boolean`
    *   `clear(): void`

### 4. `IPluginManager`
*   **Purpose:** Manages simulation plugins (registration, activation, deactivation).
*   **Key Methods:**
    *   `registerPlugin(plugin: ISimulationPlugin): void`
    *   `activatePlugin(pluginName: string): Promise<void>`
    *   `deactivatePlugin(pluginName: string): void`
    *   `getPlugin(pluginName: string): ISimulationPlugin | undefined`
    *   `getAvailablePluginNames(): string[]`

### 5. `ISimulationPlugin`
*   **Purpose:** Contract for simulation plugins (lifecycle, dependencies, systems, UI panels).
*   **Key Methods:**
    *   `getName(): string`
    *   `getDependencies(): string[]`
    *   `register(world: IWorld): void`
    *   `unregister(): void`
    *   `initializeEntities(world: IWorld): void`
    *   `getSystems(studio: IStudio): System[]`
    *   `getParameterPanels?(world: IWorld): ParameterPanelComponent[]`

### 6. `IPluginContext`
*   **Purpose:** Aggregates access for plugins (studio, world, event bus, etc.).
*   **Key Properties/Methods:**
    *   `studio: IStudio`
    *   `world: IWorld`
    *   `eventBus: IApplicationEventBus`
    *   `getStateManager(): IStateManager`

### 7. `IGraphicsManager`
*   **Purpose:** Abstracts the 3D rendering library. Manages scene, camera, and rendering operations.
*   **Key Methods:**
    *   `initialize(container: HTMLElement): void`
    *   `getScene(): any`
    *   `getCamera(): any`
    *   `render(): void`
    *   `add(object: any): void`
    *   `remove(object: any): void`

### 8. `IPhysicsEngine`
*   **Purpose:** Abstracts physics calculations, enables engine swapping and testability.
*   **Key Methods:**
    *   `init(): Promise<void>`
    *   `createRigidBody(config: any): IRigidBody`
    *   `step(deltaTime: number): void`
    *   `getRigidBodyPosition(body: IRigidBody): { x: number, y: number, z: number }`
    *   `getRigidBodyRotation(body: IRigidBody): { x: number, y: number, z: number, w: number }`
    *   `setRigidBodyPosition(body: IRigidBody, position: { x: number, y: number, z: number }): void`
    *   `setRigidBodyRotation(body: IRigidBody, rotation: { x: number, y: number, z: number, w: number }): void`
    *   `removeRigidBody(body: IRigidBody): void`

### 9. `IRigidBody`
*   **Purpose:** Abstracts rigid body representation.
*   **Key Methods:**
    *   `getPosition(): { x: number, y: number, z: number }`
    *   `getRotation(): { x: number, y: number, z: number, w: number }`
    *   `applyImpulse(impulse: { x: number, y: number, z: number }): void`

### 10. `IUIManager`
*   **Purpose:** Abstracts creation and management of UI elements.
*   **Key Methods:**
    *   `createPanel(title: string): IPanel`
    *   `addButton(panel: IPanel, title: string, onClick: () => void): void`
    *   `addBinding(panel: IPanel, target: any, key: string, options: any): void`

### 11. `IPanel`
*   **Purpose:** Generic UI panel interface.
*   **Key Methods:**
    *   `dispose(): void`

### 12. `IApplicationEventBus`
*   **Purpose:** Application-level event bus.
*   **Key Methods:**
    *   `on(event: string, listener: Function): () => void`
    *   `emit(event: string, ...args: any[]): void`
    *   `off(event: string, listener: Function): void`

### 13. `ILogger`
*   **Purpose:** Logging utility.
*   **Key Methods:**
    *   `log(...args: any[]): void`
    *   `warn(...args: any[]): void`
    *   `error(...args: any[]): void`
    *   `enable(): void`
    *   `disable(): void`

### 14. `IDisposable` (optional)
*   **Purpose:** For cleanup.
*   **Key Methods:**
    *   `dispose(): void`

### 15. `IInitializable` (optional)
*   **Purpose:** For initialization.
*   **Key Methods:**
    *   `init(): void`

### 16. `ISimulationSerializer` (add only if needed)
*   **Purpose:** For simulation serialization/deserialization.
*   **Key Methods:**
    *   `serialize(simulation: any): string`
    *   `deserialize(data: string): any`

### 17. `IUndoManager` (add only if needed)
*   **Purpose:** For undo/redo functionality.
*   **Key Methods:**
    *   `undo(): void`
    *   `redo(): void`
    *   `canUndo(): boolean`
    *   `canRedo(): boolean`




---


---

## Future Improvements

- Add architectural diagrams to visualize interface relationships.
- Expand usage examples for each interface.
- Document interface versioning and deprecation policy.
- Add notes on mocking and testing strategies for each interface group.

---

## Summary & Guidance

The current set of interfaces is optimal for the present scope of Physics Simulation Studio. It covers all major architectural boundaries and supports modularity, extensibility, and maintainability. Only add new interfaces if you introduce fundamentally new features (e.g., networking, analytics, asset management, advanced state handling) or need to abstract new boundaries. For most simulation and plugin scenarios, the existing interfaces are sufficient.

This document will serve as a living reference for the project's architectural contracts.
