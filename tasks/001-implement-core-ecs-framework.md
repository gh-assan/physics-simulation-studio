# Task: Implement the Core ECS Framework

- **Status:** Done
- **Assignee:** Unassigned
- **Priority:** High
- **Creation Date:** 2025-07-08
- **Related Epic/Feature:** Core Architecture Implementation

---

## 1. Overview & Goal

The goal of this task is to implement the foundational, application-agnostic Entity-Component-System (ECS) framework. This is the central pillar of the entire architecture, as defined in the `tech-spec.md`. This task will create the core classes responsible for managing entities, components, and systems, providing the runtime that all other parts of the application will plug into.

## 2. Architectural Context

This task is the direct implementation of the core ECS pattern described in the architecture.

- **Relevant Architectural Document:** [ARCHITECTURE.md](./../architecture/ARCHITECTURE.md)
- **Key Architectural Principles to Uphold:**
  - [x] **ECS Compliance:** This task _defines_ the core ECS implementation.
  - [ ] **Plugin Modularity:** Not directly applicable, but this work is the prerequisite for the plugin system.
  - [ ] **Decoupling:** The implementation must ensure strict separation between the `EntityManager`, `ComponentManager`, and `SystemManager`.
  - [ ] **Data-Driven Design:** The framework enables a data-driven approach, which will be leveraged by future tasks.

## 3. Technical Requirements & Implementation Plan

1.  **File(s) to be Created/Modified:**

    - `src/core/ecs/IComponent.ts` (Base component interface)
    - `src/core/ecs/System.ts` (Abstract base class for systems)
    - `src/core/ecs/EntityManager.ts`
    - `src/core/ecs/ComponentManager.ts`
    - `src/core/ecs/SystemManager.ts`
    - `src/core/ecs/World.ts` (The central orchestrator)
    - `src/core/ecs/index.ts` (To export the public API of the module)

2.  **Step-by-Step Implementation:**

    - **Step 1:** Create the `IComponent` interface. It will be an empty interface used for type-checking.
    - **Step 2:** Create the abstract `System` class with an `update(world: World, deltaTime: number): void` method.
    - **Step 3:** Implement the `EntityManager` class to handle the creation and destruction of entity IDs.
    - **Step 4:** Implement the `ComponentManager` class to manage component storage (using a Map of arrays) and retrieval.
    - **Step 5:** Implement the `SystemManager` class to register, store, and execute all systems.
    - **Step 6:** Implement the `World` class, which will hold instances of the three managers and provide the main `update(deltaTime: number)` loop that drives the `SystemManager`.
    - **Step 7:** Create the `index.ts` barrel file to export the primary classes and interfaces for other modules to consume.

3.  **Dependencies:**
    - None. This is the foundational task.

## 4. Acceptance Criteria

- [ ] A `World` instance can be successfully created.
- [ ] The `EntityManager` can create unique entity IDs and recycle them after destruction.
- [ ] A new component type (e.g., `PositionComponent`) can be defined and registered with the `ComponentManager`.
- [ ] Components can be added to, retrieved from, and removed from entities.
- [ ] The `ComponentManager` can correctly return a list of all entities that possess a specific set of components.
- [ ] A new `System` can be defined, instantiated, and registered with the `SystemManager`.
- [ ] Calling `world.update()` executes the `update` method on all registered systems.
- [ ] All new code is formatted correctly and passes the linter.

## 5. Testing Plan

A comprehensive testing plan is mandatory for this foundational code.

- **Unit Tests:**
  - [ ] `EntityManager.test.ts`: Verify entity creation, destruction, and ID reuse.
  - [ ] `ComponentManager.test.ts`: Verify component registration, adding/getting/removing components, and querying for entities.
  - [ ] `SystemManager.test.ts`: Verify system registration and execution order.
- **Integration Tests:**
  - [ ] `World.test.ts`: This will be the primary integration test. It will:
    - Create a `World`.
    - Create entities.
    - Add components to them.
    - Register a test system that modifies component data.
    - Call `world.update()` and assert that the component data was correctly modified by the system.

## 6. UI/UX Considerations (If Applicable)

- None. This is a core, non-visual, framework task.

## 7. Notes & Open Questions

- The initial implementation of `ComponentManager.getEntitiesWithComponents` can use a simple iteration method as described in the tech spec. Performance optimizations (e.g., archetypes or bitmasking) can be addressed in a future task if needed.
