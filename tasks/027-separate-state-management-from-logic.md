# Task: Separate State Management from Logic

- **Status:** Not Started
- **Assignee:** Unassigned
- **Priority:** High
- **Creation Date:** 2025-07-11
- **Related Epic/Feature:** Core Architecture Improvements

---

## 1. Overview & Goal

The goal of this task is to refactor the Physics Simulation Studio to separate state management from business logic. This will improve code maintainability, testability, and scalability. For example, managing the selected simulation state should be decoupled from the logic that interacts with the simulation.

## 2. Technical Requirements & Implementation Plan

### Implementation Plan

1. **File(s) to be Created/Modified:**
    - `src/studio/state/StateManager.ts` (create)
    - `src/studio/state/SelectedSimulationState.ts` (create)
    - `src/studio/state/StateTypes.ts` (create)
    - Refactor existing files that currently mix state management with logic.

2. **Steps:**
    - **Step 1:** Create a `StateManager` class in `StateManager.ts`.
      - Implement a centralized state management system.
      - Use an event-driven approach to notify subscribers of state changes.
    - **Step 2:** Create a `SelectedSimulationState` module.
      - Manage the state of the currently selected simulation.
      - Provide methods to get, set, and subscribe to changes in the selected simulation.
    - **Step 3:** Define state types in `StateTypes.ts`.
      - Include types for the selected simulation and other global states.
    - **Step 4:** Refactor existing logic to use the new state management system.
      - Replace direct state manipulation with calls to the `StateManager`.
      - Ensure that state changes trigger appropriate updates in the UI and logic.

## 3. Acceptance Criteria

- [ ] State management is centralized and decoupled from business logic.
- [ ] The selected simulation state is managed independently.
- [ ] State changes are event-driven and notify subscribers.
- [ ] Existing logic is refactored to use the new state management system.
- [ ] The solution is scalable and can handle additional state requirements in the future.

## 4. Testing Plan

- **Unit Tests:**
  - [ ] Test the `StateManager` class for state updates and event notifications.
  - [ ] Test the `SelectedSimulationState` module for correct state management.
- **Integration Tests:**
  - [ ] Verify that state changes trigger appropriate updates in the UI and logic.
- **Manual Testing:**
  - [ ] Test the application to ensure that state management works as expected.

---

## Notes

- Consider using a lightweight state management library if necessary.
- Ensure that the state management system is extensible for future requirements.
