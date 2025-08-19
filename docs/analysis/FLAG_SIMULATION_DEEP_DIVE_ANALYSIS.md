# Acceptance Criteria

The refactor will be considered complete and successful when all of the following criteria are met:

1. **Flag Simulation Runs Correctly**
    - The flag simulation is running, visually and functionally correct, and passes all TDD and integration tests.

2. **Clean, Modular Design**
    - The architecture follows ECS principles: data in components, logic in systems, stateless algorithms.
    - No business logic or state is duplicated across components or systems.

3. **Code Quality and Maintainability**
    - Code is clean, readable, and well-documented.
    - No legacy, unused, or redundant code remains in the codebase.
    - All files and classes have a clear, single responsibility.

4. **Automated Test Coverage**
    - All existing and new tests pass (unit, integration, TDD).
    - New tests are added for any new or refactored logic.

5. **Project Protocols Are Followed**
    - All work strictly follows the project's protocols (AI Assistant Protocol, TDD, safety checks, commit procedures, etc.).
    - Protocol compliance is verified before merging or release.

6. **Peer Review and Approval**
    - The changes are reviewed and approved by at least one other developer (or self-reviewed if solo).

7. **No Regressions**
    - No unrelated features are broken; the system is stable and robust after the refactor.

8. **Documentation Updated**
    - All relevant documentation is updated to reflect the new architecture and usage.

If any of these criteria are not met, the refactor is not considered complete.
# Acceptance Criteria

The refactor will be considered complete and successful when all of the following criteria are met:

1. **Flag Simulation Runs Correctly**
    - The flag simulation is running, visually and functionally correct, and passes all TDD and integration tests.

2. **Clean, Modular Design**
    - The architecture follows ECS principles: data in components, logic in systems, stateless algorithms.
    - No business logic or state is duplicated across components or systems.

3. **Code Quality and Maintainability**
    - Code is clean, readable, and well-documented.
    - No legacy, unused, or redundant code remains in the codebase.
    - All files and classes have a clear, single responsibility.

4. **Automated Test Coverage**
    - All existing and new tests pass (unit, integration, TDD).
    - New tests are added for any new or refactored logic.

5. **Peer Review and Approval**
    - The changes are reviewed and approved by at least one other developer (or self-reviewed if solo).

6. **No Regressions**
    - No unrelated features are broken; the system is stable and robust after the refactor.

7. **Documentation Updated**
    - All relevant documentation is updated to reflect the new architecture and usage.

If any of these criteria are not met, the refactor is not considered complete.

# Deep Dive Analysis of the Flag Simulation Architecture

## Main Goals

1. The flag simulation must be running and correct.
2. The design must be clean, modular, and follow ECS principles.
3. The codebase must be clean, readable, and maintainable.
4. All redundant, legacy, or unused code must be removed.

## 1. Executive Summary

The investigation into the failing TDD test for the flag simulation has revealed significant architectural problems that are the root cause of the current bug and will lead to future issues. The core problem is a severe violation of the **Separation of Concerns** principle, primarily concentrated in `FlagAlgorithm.ts`.

This document provides an analysis of the existing architecture, identifies key problem areas, and proposes a clear refactoring plan. The goal is to create a clean, maintainable, and scalable flag simulation system that adheres to the project's ECS (Entity-Component-System) pattern.

## 2. The Core Problem: Flawed Architecture

The current implementation is not a true ECS architecture. It's a hybrid system where a single, monolithic `FlagAlgorithm` object acts as a global manager for what should be a multi-entity simulation. This creates state management conflicts, code complexity, and makes the system difficult to debug and extend.

### 2.1. `FlagAlgorithm.ts`: The Monolith

This file is the primary source of the architectural issues. It is a 700+ line class that mixes at least four distinct responsibilities:

- **Physics Logic:** Core Verlet integration, force application, and constraint satisfaction (`step`, `integrate`, `applyForces`). This is its correct responsibility.
- **State Management:** It holds the state for a flag (points, springs) but also integrates with a `GlobalStateStore` and `PreferencesManager`. This creates two sources of truth and immense confusion.
- **UI/Parameter Management:** It contains extensive code for registering UI schemas, creating parameter panels, and handling visual feedback. This logic belongs in a dedicated UI or controller layer, not the physics algorithm.
- **Legacy Compatibility:** The class is littered with deprecated methods, overloaded `initialize` functions, and legacy support code, which obscures the intended logic.

**Conclusion:** `FlagAlgorithm.ts` should be a pure, stateless physics calculator. It should not manage its own state or interact with UI components.

### 2.2. `FlagComponent.ts`: The Confused Data Container

The component, which should be a simple data container, exhibits several issues:

- **State Duplication:** It stores `points`, `springs`, `mass`, `stiffness`, `damping`, `gravity`, and `wind`. This data is also managed inside the `FlagAlgorithm`, leading to synchronization problems.
- **Contains Logic:** It has methods like `generateInitialPoints()` and a `wind` getter. Components in an ECS architecture should be "Plain Old Data" objects with minimal to no logic. This logic belongs in a system or a utility class.

**Conclusion:** `FlagComponent.ts` should hold all the data necessary for *one* flag entity. It should be the single source of truth for the state of that specific flag.

### 2.3. `FlagSystem.ts`: The Underpowered Orchestrator

The system is the correct place to orchestrate the simulation, but its implementation is flawed due to the architectural issues above:

- **Incorrect State Initialization:** The immediate TDD bug is in `createFlag`. It incorrectly attempts to initialize a `FlagComponent` by pulling state from the global `FlagAlgorithm`, which is the wrong approach.
- **Incorrect Update Loop:** The `update` method iterates over all flag entities but calls the *same* `this.algorithm.step()` method for each one. This means if multiple flags existed, they would all share and overwrite the same simulation state within the algorithm instance, leading to chaos.

**Conclusion:** The `FlagSystem` should iterate through each entity. For each one, it should take the entity's `FlagComponent`, pass that data to a stateless `FlagAlgorithm` for processing, and then update the component with the new data.



## 3. Refactoring Plan: Clear Action Steps

Follow these steps to achieve a clean, maintainable, and correct flag simulation system:

1. **Refactor `FlagComponent` to a Pure Data Container**
    - Remove all logic (e.g., point/spring generation, getters) from `FlagComponent`.
    - Ensure it only stores data for a single flag entity (no methods, no logic).

2. **Refactor `FlagAlgorithm` to a Stateless Calculator**
    - Remove all state, UI, and legacy code from `FlagAlgorithm`.
    - Change `step()` to accept all state as arguments and return the new state.
    - Ensure there are no references to global state, UI, or preferences.

3. **Refactor `FlagSystem` as the Orchestrator**
    - On creation, initialize each `FlagComponent` with its own data.
    - In the update loop, for each entity:
      - Get the component’s data.
      - Call the stateless algorithm.
      - Update the component with the result.
    - Ensure no shared state between entities; each flag is independent.

4. **Remove Redundant and Unused Code**
    - Delete all legacy, deprecated, or unused methods and files.
    - Remove any code not used in the new architecture (UI hooks, old state management, etc.).

5. **Ensure Clean Code and Good Design**
    - Run linters and formatters.
    - Refactor for readability and maintainability.
    - Add or update documentation and code comments.

6. **Validate with Automated Tests**
    - Ensure all TDD and integration tests pass.
    - Add new tests for any new or refactored logic.

7. **Final Review and Cleanup**
    - Peer review or self-review for architecture, code quality, and design.
    - Confirm all goals and acceptance criteria are met.

By following these steps, you will achieve a robust, scalable, and maintainable flag simulation system.
