# Task 031: Fix Simulation Selector and Improve State Initialization

## Problem Description

The simulation selector dropdown is not visible in the UI. This prevents users from switching between different simulations. The root cause is a combination of issues:

1.  **State Initialization:** The `SelectedSimulationState` is not being initialized with a default simulation, leading to an unpredictable initial state.
2.  **UI Rendering:** The UI component responsible for rendering the selector is not being created or is not correctly subscribing to state changes.
3.  **Lack of Robustness:** The state management system lacks robust default values, making it susceptible to race conditions and initialization order issues.

## Analysis

The investigation revealed the following:

-   `StateManager.ts`: Uses a singleton pattern but has a weak fallback for the initial simulation state.
-   `SelectedSimulationState.ts`: Manages the `selectedSimulation` state but lacks a proper default.
-   `Studio.ts`: Correctly attempts to load the initial simulation but is dependent on a correctly initialized state.
-   `UIManager.ts`: Is not responsible for creating the simulation selector, which is the primary issue.

## Plan

1.  **Introduce Robust Default State:**
    -   Create `src/studio/state/SelectedSimulationDefaults.ts` to define a default `SelectedSimulationState`.
    -   This will ensure the application always starts in a known, valid state.

2.  **Refactor State Management:**
    -   Update `SelectedSimulationState.ts` to use the new default state.
    -   Modify `StateManager.ts` to ensure the `selectedSimulation` state is initialized correctly.

3.  **Locate and Fix the UI:**
    -   Search the codebase, starting with `src/studio/main.ts`, to find the code that creates the simulation selector.
    -   Ensure the UI component subscribes to `SelectedSimulationState` changes.
    -   Update the UI to render the selector with the available simulations and reflect the currently active one.

4.  **Verify the Fix:**
    -   Run the application and confirm that the simulation selector is visible.
    -   Test that switching simulations works as expected.
    -   Ensure that the initial simulation is loaded correctly on startup.