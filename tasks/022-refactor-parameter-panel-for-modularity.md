# Task: Refactor Parameter Panel for Modularity and Extensibility

- **Status:** Not Started
- **Assignee:** Unassigned
- **Priority:** High
- **Creation Date:** 2023-11-25
- **Related Epic/Feature:** UI Improvements

---

## 1. Overview & Goal

The goal of this task is to refactor the parameter panel in the Physics Simulation Studio to be more modular, component-like, and plugin-specific. Currently, the parameter panel is implemented in a centralized manner, with all component properties defined in a single file. This makes it difficult to extend or modify the panel for specific plugins.

The refactored parameter panel should:
1. Allow each plugin to define its own parameter panel UI
2. Make it easy to add/remove components to the panel
3. Be more modular and component-based
4. Provide a consistent API for plugins to define their parameter panels
5. Support dynamic updates when parameters change

## 2. Architectural Context

- **Relevant Architectural Document:** [Link to ARCHITECTURE.md](./../architecture/ARCHITECTURE.md)
- **Key Architectural Principles to Uphold:**
  - [ ] **ECS Compliance:** Parameter panel components should adhere to the ECS pattern.
  - [ ] **Plugin Modularity:** Each plugin should define its own parameter panel UI within its plugin directory.
  - [ ] **Decoupling:** UI parameter rendering should be decoupled from simulation logic.
  - [ ] **Data-Driven Design:** Parameter definitions should be data-driven and easily configurable.

## 3. Technical Requirements & Implementation Plan

### Current Implementation Analysis

The current parameter panel implementation has several limitations:

1. **Centralized Property Definitions:** All component properties are defined in a central file (`ComponentPropertyDefinitions.ts`), making it difficult for plugins to define their own UI panels.
2. **Limited Extensibility:** Adding or removing components requires modifying the central property definitions file.
3. **Tight Coupling:** The `PropertyInspectorSystem` is tightly coupled with the `ComponentPropertyRegistry`, making it difficult to extend or modify.
4. **Lack of Modularity:** The parameter panel is not component-based, making it difficult to reuse UI components across different plugins.

### Implementation Plan

1.  **File(s) to be Created/Modified:**

    - `src/studio/systems/PropertyInspectorSystem.ts` (modify)
    - `src/studio/utils/ComponentPropertyRegistry.ts` (modify)
    - `src/studio/utils/ComponentPropertyDefinitions.ts` (refactor or remove)
    - `src/studio/uiManager.ts` (modify)
    - `src/core/interfaces/IParameterPanel.ts` (create)
    - `src/core/components/ParameterPanelComponent.ts` (create)
    - `src/plugins/flag-simulation/FlagParameterPanel.ts` (create)
    - `src/plugins/water-simulation/WaterParameterPanel.ts` (create)

2.  **Step-by-Step Implementation:**

    - **Step 1: Define Parameter Panel Interface**
      - Create an `IParameterPanel` interface that defines the contract for parameter panels.
      - Include methods for registering UI controls, updating values, and handling events.
      - Define a standard way for plugins to register their parameter panels.

    - **Step 2: Create Parameter Panel Component**
      - Create a `ParameterPanelComponent` that implements the `IParameterPanel` interface.
      - This component will be the base class for all plugin-specific parameter panels.
      - Include methods for registering UI controls, updating values, and handling events.

    - **Step 3: Refactor Property Inspector System**
      - Modify the `PropertyInspectorSystem` to work with the new parameter panel components.
      - Instead of directly using the `ComponentPropertyRegistry`, it should discover and use parameter panel components.
      - Implement a mechanism to dynamically load parameter panels based on the selected entity's components.

    - **Step 4: Implement Plugin-Specific Parameter Panels**
      - Create `FlagParameterPanel` for the flag simulation plugin.
      - Create `WaterParameterPanel` for the water simulation plugin.
      - Each panel should define its own UI controls and handle its own events.
      - Panels should be registered with the plugin system during plugin initialization.

    - **Step 5: Update UI Manager**
      - Modify the `UIManager` to work with the new parameter panel components.
      - Implement a more flexible way to create and manage UI controls.
      - Support dynamic updates when parameters change.

    - **Step 6: Update Component Registration**
      - Modify the component registration process to include parameter panel registration.
      - Ensure that parameter panels are properly associated with their respective components.
      - Implement a mechanism to discover parameter panels for a given component.

    - **Step 7: Test and Validate**
      - Test the new parameter panel implementation with existing plugins.
      - Verify that all parameters are displayed correctly and can be modified.
      - Ensure that parameter changes are reflected in the simulation.

3.  **Dependencies:**
    - This task depends on the existing implementation of the flag and water drop simulation plugins.
    - No new third-party libraries are required.

## 4. Acceptance Criteria

- [ ] Each plugin can define its own parameter panel UI within its plugin directory.
- [ ] Parameter panels are component-based and can be easily extended or modified.
- [ ] Adding or removing components to a parameter panel is straightforward and doesn't require modifying central files.
- [ ] Parameter panels are dynamically loaded based on the selected entity's components.
- [ ] Parameter changes are immediately reflected in the UI and applied to the simulation when appropriate.
- [ ] The solution is robust and handles edge cases gracefully.
- [ ] All existing functionality continues to work correctly.

## 5. Testing Plan

- **Unit Tests:**
  - [ ] Test that parameter panel components correctly implement the `IParameterPanel` interface.
  - [ ] Test that parameter panels are properly registered and discovered.
  - [ ] Test that parameter panels correctly handle events and update values.
  - [ ] Test that the `PropertyInspectorSystem` correctly works with parameter panel components.

- **Integration Tests:**
  - [ ] Test that the flag simulation parameter panel is correctly displayed and can be modified.
  - [ ] Test that the water drop simulation parameter panel is correctly displayed and can be modified.
  - [ ] Test that parameter changes are reflected in the simulation.
  - [ ] Test that parameter panels are dynamically loaded based on the selected entity's components.

- **End-to-End (E2E) Tests:**
  - [ ] Create an E2E test that loads the flag simulation, verifies that its parameter panel is displayed, modifies parameters, and checks that the changes are applied.
  - [ ] Create an E2E test that loads the water drop simulation, verifies that its parameter panel is displayed, modifies parameters, and checks that the changes are applied.

## 6. UI/UX Considerations

- Parameter panels should have a consistent look and feel across different plugins.
- Parameter controls should be clearly labeled and grouped by component.
- Nested properties should be displayed in a hierarchical manner to reflect their structure.
- Parameter changes should provide immediate visual feedback in the UI.
- The UI should be responsive and update smoothly when parameters are changed.
- Error states (e.g., invalid parameter values) should be clearly indicated to the user.

## 7. Notes & Open Questions

- Should we consider a more declarative approach to defining parameter panels, such as using decorators or a schema-based system?
- How should we handle dependencies between parameters (e.g., if one parameter's valid range depends on another parameter's value)?
- Should we implement a preview mode that allows users to see the effects of parameter changes without fully running the simulation?
- How should we handle complex parameter types, such as vectors, colors, or custom objects?
- Should we provide a way for plugins to define custom UI controls for specific parameter types?
