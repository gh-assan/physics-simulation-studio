# Task: Refactor System Management for Robust Control Flow

**Objective:** Address the root cause of the recurring rendering failures by refactoring the core ECS `SystemManager` to support declarative, priority-based execution. This will eliminate the fragile and error-prone manual manipulation of the system registry.

**Background:** The current `SimulationOrchestrator` manually un-registers and re-registers the `RenderSystem` to force it to run last. This is a fragile workaround for the lack of a proper system execution ordering mechanism in the `SystemManager`. This task will implement a robust, priority-based system that ensures predictable execution order.

--- 

### Step 1: Introduce System Priority

**Goal:** Modify the `System` class and the `SystemManager` to support a `priority` property.

**Implementation:**

1.  **Modify `src/core/ecs/System.ts`:**
    *   Add a public `priority` property to the `System` class, typed as a `number`.
    *   Update the constructor to accept an optional `priority` argument, defaulting to a reasonable value (e.g., `100`).

2.  **Modify `src/core/ecs/SystemManager.ts`:**
    *   In the `registerSystem` method, ensure the `priority` of the incoming system is stored along with the system itself.
    *   In the `updateAll` method, before iterating over the systems, sort the internal list of systems based on their `priority` in ascending order (lower numbers run first).

**Testing & Verification:**

*   Create a new test file `src/core/ecs/SystemManager.test.ts`.
*   Write a unit test that registers three systems with different priorities (e.g., 10, 100, 200).
*   The test should mock the `update` method of each system and push the system's name or priority to an array.
*   After calling `systemManager.updateAll()`, assert that the array contains the system identifiers in the correct order of execution (10, 100, 200).
*   Run the test and ensure it passes.

--- 

### Step 2: Assign Priorities to Core Systems

**Goal:** Assign explicit priorities to the core rendering and UI systems to enforce a stable execution order.

**Implementation:**

1.  **Modify `src/studio/systems/RenderSystem.ts`:**
    *   In the constructor of `RenderSystem`, pass a low priority value to the `super()` call (e.g., `1000`). This will ensure it runs after most other systems.

2.  **Modify `src/studio/systems/PropertyInspectorSystem.ts`:**
    *   In the constructor of `PropertyInspectorSystem`, assign a medium priority (e.g., `500`).

3.  **Modify `src/studio/systems/SelectionSystem.ts`:**
    *   In the constructor of `SelectionSystem`, assign a medium priority (e.g., `500`).

**Testing & Verification:**

*   No new tests are strictly required for this step, as the verification will be part of the integration testing in the following steps. However, you can run the existing test suite to ensure no regressions have been introduced.

--- 

### Step 3: Refactor the Simulation Orchestrator

**Goal:** Simplify the `SimulationOrchestrator` to remove the manual `RenderSystem` manipulation.

**Implementation:**

1.  **Modify `src/studio/SimulationOrchestrator.ts`:**
    *   In the `loadSimulation` method, **remove** the following lines of code:
        *   The temporary un-registration of the `RenderSystem`.
        *   The re-registration of the `RenderSystem` at the end of the method.
    *   The method should now be much simpler: deactivate the old plugin, clear the world, activate the new plugin, and initialize entities.

**Testing & Verification:**

*   This is the most critical verification step.
*   Run the application (`npm start`).
*   **Verify that the flag simulation loads and renders correctly by default.**
*   Use the UI to switch to the "Water Simulation" and then back to the "Flag Simulation".
*   **Verify that the flag simulation still renders correctly after switching.**
*   If both of these checks pass, the refactoring was successful.

--- 

### Step 4: Clean Up and Final Review

**Goal:** Remove any dead code or unnecessary comments related to the old system.

**Implementation:**

1.  Review the `SimulationOrchestrator.ts` file for any comments that are now obsolete.
2.  Ensure the code is clean, well-formatted, and that all changes are consistent with the project's coding style.

**Testing & Verification:**

*   Run the full test suite (`npm test`) one last time to ensure all tests pass.
*   Perform a final manual check of the application to confirm that all simulation switching and rendering functionality is working as expected.
