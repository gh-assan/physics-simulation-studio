# Task 032: Fix Missing Simulation Parameter Panel

## Problem Description

The simulation parameter panel, which should display controls for the selected entity or simulation, is not being shown in the UI. The console log `[PropertyInspectorSystem] Current selected entity: null` strongly suggests that the system responsible for the panel (`PropertyInspectorSystem`) is not rendering because it requires a selected entity and none is selected by default.

## Analysis

The investigation will focus on the following areas:

1.  **`PropertyInspectorSystem.ts`:** Analyze its logic to confirm how it's triggered and what data it needs. The key is to understand if it can operate without a selected entity (e.g., to show global simulation settings).
2.  **`SelectionHandler.ts`:** Investigate how entity selection is handled and how the selection state is managed and propagated throughout the application.
3.  **Plugin Initialization:** Examine how plugins create their initial entities and whether they are being assigned the necessary `ParameterPanelComponent`.
4.  **State Management:** Review the application's state to see how the "selected entity" is stored and accessed.

## Plan

1.  **Analyze Core Systems:**
    -   Read `src/studio/systems/PropertyInspectorSystem.ts` to understand its behavior.
    -   Read `src/studio/systems/SelectionHandler.ts` to understand the selection mechanism.
    -   Examine the relevant plugin files (e.g., `src/plugins/flag-simulation/index.ts`) to see how initial entities are created.

2.  **Implement a Solution:**
    -   The preferred solution will be to modify the `PropertyInspectorSystem` to be more flexible. When no entity is selected, it should attempt to display a parameter panel for the currently active simulation. This provides a better user experience, as there will always be relevant controls visible.
    -   If the above is not feasible, an alternative is to ensure a default entity is selected when a simulation is loaded.

3.  **Verify the Fix:**
    -   Run the application and confirm that the parameter panel is visible upon loading a simulation.
    -   Test that selecting different entities correctly updates the parameter panel.
    -   Ensure that when no entity is selected, the panel displays the global settings for the active simulation.