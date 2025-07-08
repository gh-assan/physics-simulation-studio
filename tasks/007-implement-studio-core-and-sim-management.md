# Task: Implement Core Studio Functionality and Simulation Management

- **Status:** Not Started
- **Assignee:** Unassigned
- **Priority:** High
- **Creation Date:** 2025-07-08
- **Related Epic/Feature:** Core Studio Enhancements

---

## 1. Overview & Goal

This task aims to transform the current physics simulation environment into a more generic studio. The primary objective is to implement core studio functionalities, including global simulation controls (Play, Pause, Reset) and a robust mechanism for managing and switching between different registered simulations (plugins). The flag simulation will be integrated as the first selectable simulation within this new framework. This fulfills the need for a flexible, extensible studio capable of hosting multiple distinct physics simulations.

## 2. Architectural Context

This task is central to evolving the studio's architecture towards a more modular and user-friendly design.

- **Relevant Architectural Document:** [Link to ARCHITECTURE.md](./../architecture/ARCHITECTURE.md)
- **Key Architectural Principles to Uphold:**
  - [x] **ECS Compliance:** New systems or components must adhere to the ECS pattern.
  - [x] **Plugin Modularity:** Each simulation should remain a self-contained plugin, activated/deactivated as a whole.
  - [x] **Decoupling:** Ensure core studio logic is decoupled from specific simulation logic. The studio should manage the lifecycle of simulations, not their internal workings. UI should be decoupled from core simulation logic.
  - [x] **Data-Driven Design:** Simulation selection and configuration should ideally be data-driven.

## 3. Technical Requirements & Implementation Plan

### 1. File(s) to be Created/Modified:

-   `src/studio/main.ts` (Orchestration of studio components, main loop management)
-   `src/studio/Studio.ts` (New: Encapsulates core studio state and global controls)
-   `src/studio/uiManager.ts` (Integration of new UI elements for global controls and simulation selection)
-   `src/core/plugin/PluginManager.ts` (Potentially add methods to list available plugins)
-   `src/studio/systems/RenderSystem.ts` (Ensure it can adapt to different active simulations)
-   `src/studio/systems/PropertyInspectorSystem.ts` (Ensure it can adapt to different active simulations)
-   `src/plugins/flag-simulation/index.ts` (Ensure it correctly registers/unregisters its components/systems)

### 2. Step-by-Step Implementation:

1.  **Define `Studio` Class:**
    *   Create `src/studio/Studio.ts`.
    *   This class will hold the `World` instance, `PluginManager`, and manage the global simulation state (playing, paused, current simulation).
    *   It will have methods like `play()`, `pause()`, `reset()`, `loadSimulation(pluginName: string)`.
    *   The main animation loop will be managed by this `Studio` class.

2.  **Refactor `main.ts`:**
    *   Instantiate the new `Studio` class.
    *   Move the main animation loop into the `Studio` class.
    *   `main.ts` will primarily be responsible for initializing the `Studio` and setting up the initial UI.

3.  **Implement Global Controls (Play/Pause/Reset):**
    *   Add `play()`, `pause()`, `reset()` methods to the `Studio` class.
    *   Modify the `Studio`'s update loop to only call `world.update()` when `isPlaying` is true.
    *   Integrate these controls into the `UIManager` or directly into `main.ts` using `tweakpane` for a global control panel.

4.  **Enhance `PluginManager`:**
    *   Add a method `getAvailablePluginNames(): string[]` to `PluginManager` to retrieve the names of all registered plugins.

5.  **Implement Simulation Selection UI:**
    *   In `uiManager.ts` or `main.ts`, create a dropdown or similar UI element using `tweakpane` that lists the available simulation names (obtained from `PluginManager`).
    *   When a simulation is selected, call `studio.loadSimulation(selectedPluginName)`.

6.  **Implement `loadSimulation` in `Studio`:**
    *   This method will:
        *   Deactivate the currently active plugin (if any) using `pluginManager.deactivatePlugin()`.
        *   Clear the `World` (e.g., remove all entities and components, or reset the `World` state).
        *   Activate the newly selected plugin using `pluginManager.activatePlugin()`.
        *   Re-create any necessary initial entities for the new simulation (e.g., the flag entity for the flag simulation).

7.  **Integrate Flag Simulation:**
    *   Ensure the `FlagSimulationPlugin` is registered with the `PluginManager` at startup.
    *   Modify the initial setup in `main.ts` so that the flag simulation is loaded via the `studio.loadSimulation()` method, rather than directly adding its components.

8.  **Adapt RenderSystem and PropertyInspectorSystem:**
    *   Ensure these systems correctly handle the dynamic loading/unloading of entities and components as simulations are switched. They should query the `World` for relevant components in their `update` methods.

### 3. Dependencies:

-   This task depends on the existing ECS framework and Plugin System.
-   `tweakpane` will be used for UI controls.

## 4. Acceptance Criteria

-   [ ] A global "Play" button is visible and starts the simulation loop.
-   [ ] A global "Pause" button is visible and stops the simulation loop.
-   [ ] A global "Reset" button is visible and reinitializes the currently active simulation.
-   [ ] A dropdown or similar UI element lists "flag-simulation" as a selectable option.
-   [ ] Selecting "flag-simulation" from the UI correctly loads and displays the flag simulation.
-   [ ] Switching between simulations (if multiple are registered later) correctly deactivates the previous and activates the new one, clearing the scene as appropriate.
-   [ ] The flag simulation's Tweakpane controls (gravity, wind) are still functional when the flag simulation is active.
-   [ ] No console errors related to component registration or undefined properties occur during simulation loading/unloading or control interaction.
-   [ ] The application remains stable and performant during simulation switching.
-   [ ] All new code is formatted correctly and passes the linter.

## 5. Testing Plan

-   **Unit Tests:**
    -   Test `Studio.play()`, `Studio.pause()`, `Studio.reset()` methods in isolation.
    -   Test `Studio.loadSimulation()` to ensure correct plugin activation/deactivation and world clearing.
    -   Test `PluginManager.getAvailablePluginNames()`.
-   **Integration Tests:**
    -   Verify that `Studio` correctly orchestrates `World` and `PluginManager` during simulation lifecycle events.
    -   Test that `RenderSystem` and `PropertyInspectorSystem` correctly update when simulations are switched.
-   **End-to-End (E2E) Tests:**
    -   Simulate user interaction: click Play, Pause, Reset.
    -   Simulate user selecting "flag-simulation" from the dropdown and verify the flag appears and is interactive.
    -   (Future: Simulate switching between multiple simulations).

## 6. UI/UX Considerations (If Applicable)

-   A new Tweakpane folder or separate pane will be created for "Global Controls" at the top level.
-   This folder will contain:
    -   A button for "Play".
    -   A button for "Pause".
    -   A button for "Reset".
    -   A dropdown/list for "Select Simulation" populated with available plugin names.
-   The existing flag simulation controls (gravity, wind) will appear only when the "flag-simulation" is active.

## 7. Notes & Open Questions

-   How should the `World` be "cleared" when switching simulations? Should it remove all entities, or should each plugin be responsible for cleaning up its own entities upon deactivation? For now, assume `World.clear()` will remove all entities and components.
-   Consider how to handle initial entity creation for each simulation. Should plugins provide a factory method for their default scene setup? For now, `loadSimulation` will directly create the flag entity.
-   Error handling for failed plugin activation or invalid plugin names.
