# Task 034: Refactor Entity Selection Logic

## Problem Description

The parameter panel disappears when the simulation is started or paused. This is due to an architectural violation where the `PropertyInspectorSystem`'s `findSelectedEntity` method has a side effect: it attempts to set `isSelected = true` as a fallback if no entity is explicitly selected. This creates race conditions and unpredictable state changes, causing the UI to flicker or disappear.

## Analysis

-   **Side Effects in Getters:** The `findSelectedEntity` method, which should only retrieve information, is modifying the `isSelected` property of `SelectableComponent` instances. This is an anti-pattern.
-   **Scattered Selection Logic:** The responsibility for managing entity selection is not centralized, leading to implicit and hard-to-debug interactions.
-   **Unpredictable UI:** The `PropertyInspectorSystem` is reacting to an unstable `isSelected` state, causing the parameter panel to disappear.

## Architectural Refactoring Plan

We will centralize and make explicit the entity selection management:

1.  **Remove Side Effect from `PropertyInspectorSystem.findSelectedEntity`:**
    -   Modify `findSelectedEntity` to *only* return the ID of an entity that is *already* marked as `isSelected`.
    -   It will *not* set `isSelected = true` as a fallback. If no entity is explicitly selected, it will return `null`.

2.  **Introduce a Dedicated `SelectionSystem`:**
    -   Create a new `SelectionSystem` (or enhance an existing `SelectionHandler` if one is found to be suitable) whose sole responsibility is to manage entity selection.
    -   This system will:
        -   Listen for user input (e.g., mouse clicks on renderable entities).
        -   Update the `isSelected` property of `SelectableComponent` instances.
        -   **Crucially, it will be responsible for setting a *default* selected entity when a simulation loads, if no other entity is explicitly selected.** This ensures the parameter panel always has something to display.

3.  **Modify `PropertyInspectorSystem` to Rely on `SelectionSystem`:**
    -   The `PropertyInspectorSystem` will simply query the `SelectionSystem` for the currently selected entity. It will no longer contain any logic for *determining* or *setting* the selection.

## Implementation Steps

1.  **Modify `PropertyInspectorSystem.ts`:** Remove the `isSelected = true` side effect from `findSelectedEntity`.
2.  **Create `src/studio/systems/SelectionSystem.ts`:** Implement the new system.
3.  **Integrate `SelectionSystem`:** Register it in `main.ts` and ensure it's initialized correctly.
4.  **Update `PropertyInspectorSystem`:** Modify it to use the `SelectionSystem` to get the selected entity.
5.  **Verify the Fix:**
    -   Confirm that the parameter panel remains visible and stable during play/pause cycles.
    -   Test that clicking on entities correctly selects them and updates the panel.
    -   Ensure a default entity is selected and its panel is shown when a simulation loads.