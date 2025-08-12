# Task: Implement the Rigid-Body Physics Plugin

- **Status:** Done
- **Assignee:** Unassigned
- **Priority:** High
- **Creation Date:** 2025-07-08
- **Related Epic/Feature:** Core Simulation Capabilities

---

## 1. Overview & Goal

This task involves implementing the first concrete simulation plugin: the Rigid-Body Physics Plugin. This plugin will integrate the Rapier.rs physics engine into the studio, allowing for the simulation of rigid bodies, their collisions, and interactions. It will serve as a crucial validation of both the ECS framework and the plugin management system.

## 2. Architectural Context

This task directly implements the case study described in Section 2.3 of the `tech-spec.md` and leverages the core ECS and Plugin architecture.

- **Relevant Architectural Document:** [ARCHITECTURE.md](./../architecture/ARCHITECTURE.md)
- **Key Architectural Principles to Uphold:**
  - [x] **ECS Compliance:** Define `RigidBodyComponent` and `PhysicsSystem` that operate within the ECS.
  - [x] **Plugin Modularity:** The entire plugin must be self-contained within its own directory (`src/plugins/rigid-body/`) and implement `ISimulationPlugin`.
  - [x] **Decoupling:** Ensure strict separation between the physics engine (wrapped by `PhysicsWrapper`), the ECS, and any future rendering logic.
  - [x] **Data-Driven Design:** The behavior of rigid bodies will be determined by the data in their components.

## 3. Technical Requirements & Implementation Plan

1.  **File(s) to be Created/Modified:**

    - `src/plugins/rigid-body/index.ts` (Plugin entry point)
    - `src/plugins/rigid-body/components.ts` (Physics-specific components)
    - `src/plugins/rigid-body/system.ts` (The physics system)
    - `src/plugins/rigid-body/physics-wrapper.ts` (Wrapper for Rapier.rs)
    - `src/core/components/PositionComponent.ts` (New core component)
    - `src/core/components/RotationComponent.ts` (New core component)
    - `src/core/components/index.ts` (Barrel file for core components)

2.  **Step-by-Step Implementation:**

    - **Step 1: Install Rapier.rs:** Add `@dimforge/rapier3d-compat` to `package.json`.
    - **Step 2: Create Core Components:** Define `PositionComponent` (x, y, z) and `RotationComponent` (x, y, z, w for quaternion) in `src/core/components/`.
    - **Step 3: Implement `PhysicsWrapper`:** Create `src/plugins/rigid-body/physics-wrapper.ts` to encapsulate Rapier.rs. It will initialize the physics world and provide a `step()` method.
    - **Step 4: Define `RigidBodyComponent`:** Create `src/plugins/rigid-body/components.ts` to hold the Rapier `RigidBody` instance and other physics-related data.
    - **Step 5: Implement `PhysicsSystem`:** Create `src/plugins/rigid-body/system.ts`. This system will:
      - Step the `PhysicsWrapper`'s world.
      - Query for entities with `RigidBodyComponent`, `PositionComponent`, and `RotationComponent`.
      - Synchronize the `RigidBody`'s position and rotation back to the ECS `PositionComponent` and `RotationComponent`.
    - **Step 6: Implement `RigidBodyPlugin`:** Create `src/plugins/rigid-body/index.ts`. This class will implement `ISimulationPlugin` and:
      - Register `RigidBodyComponent` with the `World`'s `ComponentManager`.
      - Register `PhysicsSystem` with the `World`'s `SystemManager`.
      - Initialize the `PhysicsWrapper`.

3.  **Dependencies:**
    - This task depends on the successful completion of `001-implement-core-ecs-framework.md` and `002-implement-plugin-system.md`.

## 4. Acceptance Criteria

- [ ] Rapier.rs is successfully integrated as a dependency.
- [ ] `PositionComponent` and `RotationComponent` are correctly defined and accessible.
- [ ] The `PhysicsWrapper` can initialize and step a Rapier.rs physics world.
- [ ] `RigidBodyComponent` can store a Rapier `RigidBody` instance.
- [ ] The `RigidBodyPlugin` can be registered with the `PluginManager`.
- [ ] Activating the `RigidBodyPlugin` successfully registers `RigidBodyComponent` and `PhysicsSystem` with the `World`.
- [ ] The `PhysicsSystem` correctly updates the `PositionComponent` and `RotationComponent` of entities based on the Rapier.rs simulation.
- [ ] All new code is formatted correctly and passes the linter.

## 5. Testing Plan

- **Unit Tests:**
  - [ ] `PhysicsWrapper.test.ts`: Test initialization and stepping of the Rapier world (mocking Rapier if necessary).
  - [ ] `RigidBodyComponent.test.ts`: Verify component data storage.
- **Integration Tests:**
  - [ ] `PhysicsSystem.test.ts`: Test that the system correctly synchronizes data between Rapier bodies and ECS components.
  - [ ] `RigidBodyPlugin.test.ts`: Test that the plugin correctly registers its components and systems with the `World` when activated.
- **End-to-End (E2E) Tests:**
  - [ ] (Future task) Once rendering is implemented, an E2E test will verify that a simulated rigid body (e.g., a falling box) visually behaves as expected.

## 6. UI/UX Considerations (If Applicable)

- None for this task. UI integration for physics parameters will be a separate, later task.

## 7. Notes & Open Questions

- The initial implementation of `PhysicsSystem` will focus on synchronizing position and rotation. Other physics properties (velocity, forces) can be added later.
- Consider using a simple `console.log` to verify the `PositionComponent` values change during simulation steps for initial testing before visual rendering is available.
