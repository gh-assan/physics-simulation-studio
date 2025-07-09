# PropertyInspectorSystem State Management

## Overview

The PropertyInspectorSystem is responsible for managing the parameter panel UI in the Physics Simulation Studio. It listens for simulation events, tracks the active simulation and selected entity, and updates the UI accordingly.

## State Management Flow

### State Tracking

The PropertyInspectorSystem tracks the following state:

1. **Active Simulation**: The name of the currently active simulation.
   - Updated in `onSimulationLoaded` and `onSimulationPlayPause` from event details.
   - Retrieved in `update` and `updateInspectorForEntity` using `studio.getActiveSimulationName()`.

2. **Selected Entity**: The ID of the currently selected entity.
   - Updated in `update` when a new entity is selected.
   - Reset in `onSimulationLoaded` and `onSimulationPlayPause` to force a UI refresh.

3. **Last Active Simulation**: The name of the previously active simulation.
   - Used to detect changes in the active simulation.
   - Updated in `update` when the active simulation changes.

4. **Last Selected Entity**: The ID of the previously selected entity.
   - Used to detect changes in the selected entity.
   - Updated in `update` when the selected entity changes.

### Event Handling

The PropertyInspectorSystem listens for the following events:

1. **simulation-loaded**: Dispatched when a simulation is loaded.
   - Updates `activeSimulationName` from the event.
   - Resets `lastSelectedEntity` to force a UI refresh.
   - Deselects all entities to force a fresh selection.

2. **simulation-play**: Dispatched when play is clicked.
   - Updates `activeSimulationName` from the event.
   - Resets `lastSelectedEntity` to force a UI refresh.
   - Updates the UI immediately.

3. **simulation-pause**: Dispatched when pause is clicked.
   - Updates `activeSimulationName` from the event.
   - Resets `lastSelectedEntity` to force a UI refresh.
   - Updates the UI immediately.

### UI Update Flow

The UI is updated in the following situations:

1. **On Update**: Called every frame.
   - Gets the current selected entity and active simulation.
   - If either has changed, clears the UI and updates it.

2. **On Event**: Called when a simulation event is received.
   - Updates state from the event.
   - Forces a UI refresh by resetting `lastSelectedEntity`.
   - Updates the UI immediately if an entity is selected.

3. **On Entity Selection**: Called when an entity is selected.
   - Detected in `update` by comparing `currentSelectedEntity` with `lastSelectedEntity`.
   - Clears the UI and updates it with the selected entity's components.

### Parameter Panel Retrieval

Parameter panels are retrieved from the active plugin using the following flow:

1. Get the active simulation name from `studio.getActiveSimulationName()`.
2. Get the active plugin from `pluginManager.getPlugin(activeSimulationName)`.
3. Call `getParameterPanels()` on the active plugin to get the parameter panels.
4. Use the parameter panels to register UI controls for components.

## Best Practices

1. Always use `studio.getActiveSimulationName()` to get the active simulation name when needed for UI updates or filtering.
2. Update `activeSimulationName` from events to track the active simulation name for event handling.
3. Reset `lastSelectedEntity` to force a UI refresh when needed.
4. Clear the UI before updating it to avoid stale controls.
5. Filter components based on the active simulation to avoid showing components from inactive simulations.
