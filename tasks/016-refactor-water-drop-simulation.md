# Task: Refactor Water Drop Simulation Plugin

- **Status:** Completed
- **Assignee:** Unassigned
- **Priority:** High
- **Creation Date:** 2025-07-09
- **Related Epic/Feature:** Water Drop Simulation Improvements

---

## 1. Overview & Goal

The goal of this task is to refactor the water drop simulation plugin to improve its readability, modularity, and maintainability. This includes breaking down long files, simplifying complex logic, and ensuring strict adherence to the ECS pattern, following a similar approach to the flag simulation plugin.

## 2. Architectural Context

- **Relevant Architectural Document:** [Link to ARCHITECTURE.md](./../architecture/ARCHITECTURE.md)
- **Key Architectural Principles to Uphold:**
  - [x] **ECS Compliance:** Ensure the `WaterSystem` and `WaterComponents` adhere to the ECS pattern.
  - [x] **Plugin Modularity:** Maintain self-contained logic within the water drop simulation plugin.
  - [x] **Decoupling:** Separate simulation logic from rendering and UI concerns.

## 3. Technical Requirements & Implementation Plan

1.  **File(s) to be Created/Modified:**

  - `src/plugins/water-simulation/WaterSystem.ts`
  - `src/plugins/water-simulation/WaterComponents.ts`
  - `src/plugins/water-simulation/utils/WaterPhysicsHelpers.ts`
  - `src/plugins/water-simulation/types.ts` (New file for interfaces/types)
  - `src/plugins/water-simulation/utils/Vector3.ts` (If not already present and applicable)

2.  **Step-by-Step Implementation:**

  - Step 1: Analyze the current `WaterSystem.ts` and `WaterComponents.ts` to identify physics-related interfaces/types and functions that can be extracted.
  - Step 2: Create `src/plugins/water-simulation/types.ts` and move all physics-related interfaces (e.g., for particles, droplets, etc.) from `WaterComponents.ts` and `WaterSystem.ts` into this new file.
  - Step 3: Create `src/plugins/water-simulation/utils/WaterPhysicsHelpers.ts` and move physics-related functions (e.g., `applyForces`, `integrateParticles`, `satisfyConstraints`, `initializeWaterParticles`) from `WaterSystem.ts` into this file. Ensure these functions operate on the types defined in `types.ts`.
  - Step 4: Refactor `WaterComponents.ts` to ensure it only handles component definitions, importing types from `types.ts` as needed.
  - Step 5: Update `WaterSystem.ts` to import and utilize functions from `WaterPhysicsHelpers.ts` and types from `types.ts`. Simplify the `update` method by delegating tasks to these helper functions.
  - Step 6: If applicable, introduce and integrate a `Vector3` utility class (similar to `src/plugins/flag-simulation/utils/Vector3.ts`) for vector math operations within `WaterPhysicsHelpers.ts` and `WaterComponents.ts`.
  - Step 7: Add comprehensive unit tests for all functions in `WaterPhysicsHelpers.ts`. Ensure these tests cover various scenarios and edge cases.
  - Step 8: Update existing tests (e.g., `WaterSystem.test.ts`) to reflect the refactored structure and ensure they continue to pass.
  - Step 9: Add comments and documentation to the refactored code for better maintainability.
  - Step 10: Run performance tests to ensure no regressions are introduced.

3.  **Dependencies:**
  - None directly, but this task should be completed before adding new features to the water drop simulation plugin.

## 4. Acceptance Criteria

- [ ] `WaterSystem.ts` and `WaterComponents.ts` are modularized and adhere to the Single Responsibility Principle.
- [ ] All physics-related interfaces/types are extracted to `src/plugins/water-simulation/types.ts`.
- [ ] All physics-related helper functions are extracted to `src/plugins/water-simulation/utils/WaterPhysicsHelpers.ts`.
- [ ] The `WaterSystem.update()` method is simplified and delegates all physics logic to `WaterPhysicsHelpers.ts`.
- [ ] Comprehensive unit tests are added for all functions in `WaterPhysicsHelpers.ts`.
- [ ] The water simulation plugin passes all existing and new tests.
- [ ] Code quality checks (e.g., linting, formatting) pass without errors.
- [ ] No performance regressions are introduced.
- [ ] The refactored code is reviewed and approved by a peer.
