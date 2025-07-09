# Task: Fix Parameter Rendering for Flag and Water Drop Simulations

- **Status:** Not Started
- **Assignee:** Unassigned
- **Priority:** High
- **Creation Date:** 2023-11-20
- **Related Epic/Feature:** UI Improvements

---

## 1. Overview & Goal

The goal of this task is to fix parameter rendering issues for the flag and water drop simulations in the Physics Simulation Studio. Currently, parameters for these simulations are not consistently displayed in the UI, preventing users from adjusting simulation properties effectively. This task will identify the root cause of these rendering issues, implement a robust solution, and ensure that all parameters are properly displayed and functional for both simulations.

## 2. Architectural Context

- **Relevant Architectural Document:** [Link to ARCHITECTURE.md](./../architecture/ARCHITECTURE.md)
- **Key Architectural Principles to Uphold:**
  - [ ] **ECS Compliance:** Ensure all component parameter handling adheres to the ECS pattern.
  - [ ] **Plugin Modularity:** Parameter definitions should be contained within their respective plugin directories.
  - [ ] **Decoupling:** UI parameter rendering should be decoupled from simulation logic.
  - [ ] **Data-Driven Design:** Parameter definitions should be data-driven and easily configurable.

## 3. Technical Requirements & Implementation Plan

### Potential Causes of Parameter Rendering Issues

1. **Component Type Mismatch**: The component's static `type` property might not match the key used in the ComponentPropertyRegistry.
2. **Missing Instance Type Property**: Some components might be missing the instance `type` property that references the static type.
3. **Inconsistent Component Registration**: Components might be registered with different keys in different places (e.g., `Component.name` vs `Component.type`).
4. **Property Path Resolution Issues**: Nested properties (like `gravity.x`) might not be correctly resolved in the UI binding.
5. **Component Lifecycle Timing**: Parameters might not be registered before they're needed by the UI.
6. **Event Handling Problems**: The 'simulation-loaded' or 'parameter-changed' events might not be properly propagated.
7. **UI Refresh Timing**: The UI might not refresh when components are added or modified.
8. **Property Definition Format**: The property definitions might not match the expected format for the UI controls.
9. **Component Storage Key Mismatch**: Components might be stored with one key but retrieved with another.
10. **Circular Dependencies**: There might be circular dependencies between component registration and property definition.

### Debug Strategy

1. **Logging Enhancement**:
   - Add detailed logging to track component registration, property definition, and UI binding.
   - Log the keys used to store and retrieve components and properties.
   - Log the component instances and their properties when they're registered and when they're rendered.

2. **Component Registration Verification**:
   - Verify that all components are registered with consistent keys.
   - Check that both static and instance `type` properties are correctly defined.
   - Ensure that components are registered before they're needed by the UI.

3. **UI Binding Inspection**:
   - Inspect the UI binding process to ensure that properties are correctly bound to UI controls.
   - Verify that nested properties are correctly resolved.
   - Check that the UI is refreshed when components are added or modified.

4. **Event Propagation Testing**:
   - Test that the 'simulation-loaded' and 'parameter-changed' events are properly propagated.
   - Verify that the UI responds correctly to these events.

5. **Component Storage Analysis**:
   - Analyze how components are stored and retrieved in the ComponentManager.
   - Check for mismatches between storage and retrieval keys.

### Implementation Plan

1.  **File(s) to be Created/Modified:**

    - `src/studio/systems/PropertyInspectorSystem.ts`
    - `src/studio/utils/ComponentPropertyRegistry.ts`
    - `src/studio/utils/ComponentPropertyDefinitions.ts`
    - `src/studio/uiManager.ts`
    - `src/plugins/flag-simulation/FlagComponent.ts`
    - `src/plugins/water-simulation/WaterComponents.ts`
    - `src/core/ecs/ComponentManager.ts`

2.  **Step-by-Step Implementation:**

    - **Step 1: Enhance Logging for Debugging**
      - Add detailed logging to track component registration, property definition, and UI binding.
      - Log the keys used to store and retrieve components and properties.
      - Log the component instances and their properties when they're registered and when they're rendered.

    - **Step 2: Standardize Component Type Handling**
      - Ensure all components have both static and instance `type` properties.
      - Update the ComponentManager to consistently use the `type` property for storage and retrieval.
      - Modify the PropertyInspectorSystem to prioritize the `type` property when looking up component properties.

    - **Step 3: Improve Property Path Resolution**
      - Enhance the UIManager's handling of nested properties.
      - Add better error handling for missing or undefined properties.
      - Implement a more robust property path resolution algorithm.

    - **Step 4: Implement UI Refresh Mechanism**
      - Add a mechanism to refresh the UI when components are added or modified.
      - Ensure the PropertyInspectorSystem responds correctly to 'simulation-loaded' events.
      - Add a new 'component-modified' event to trigger UI updates when component properties change.

    - **Step 5: Update Component Property Definitions**
      - Review and update property definitions for all components.
      - Ensure property definitions match the actual component properties.
      - Add missing property definitions for the flag and water drop simulations.

    - **Step 6: Test and Validate**
      - Test the parameter rendering for both flag and water drop simulations.
      - Verify that all parameters are displayed correctly and can be modified.
      - Ensure that parameter changes are reflected in the simulation.

3.  **Dependencies:**
    - This task depends on the existing implementation of the flag and water drop simulation plugins.
    - No new third-party libraries are required.

## 4. Acceptance Criteria

- [ ] All parameters for the FlagComponent are properly displayed in the UI.
- [ ] All parameters for the WaterBodyComponent and WaterDropletComponent are properly displayed in the UI.
- [ ] Nested properties (like gravity.x, windDirection.y) are correctly displayed and can be modified.
- [ ] Parameter changes are immediately reflected in the UI and applied to the simulation when appropriate.
- [ ] The UI is refreshed when components are added or modified.
- [ ] All existing functionality continues to work correctly.
- [ ] The solution is robust and handles edge cases gracefully.

## 5. Testing Plan

- **Unit Tests:**
  - [ ] Test that all components have both static and instance `type` properties.
  - [ ] Test that the ComponentManager correctly stores and retrieves components using the `type` property.
  - [ ] Test that the PropertyInspectorSystem correctly identifies and registers component properties.
  - [ ] Test that the UIManager correctly binds properties to UI controls.

- **Integration Tests:**
  - [ ] Test that the flag simulation parameters are correctly displayed and can be modified.
  - [ ] Test that the water drop simulation parameters are correctly displayed and can be modified.
  - [ ] Test that parameter changes are reflected in the simulation.
  - [ ] Test that the UI is refreshed when components are added or modified.

- **End-to-End (E2E) Tests:**
  - [ ] Create an E2E test that loads the flag simulation, verifies that all parameters are displayed, modifies them, and checks that the changes are applied.
  - [ ] Create an E2E test that loads the water drop simulation, verifies that all parameters are displayed, modifies them, and checks that the changes are applied.

## 6. UI/UX Considerations

- Parameter controls should be clearly labeled and grouped by component.
- Nested properties should be displayed in a hierarchical manner to reflect their structure.
- Parameter changes should provide immediate visual feedback in the UI.
- The UI should be responsive and update smoothly when parameters are changed.
- Error states (e.g., invalid parameter values) should be clearly indicated to the user.

## 7. Notes & Open Questions

- Should we consider a more declarative approach to defining component properties, such as using decorators or a schema-based system?
- Is there a need for a more sophisticated property editor for complex properties like vectors or colors?
- Should we implement a preview mode that allows users to see the effects of parameter changes without fully running the simulation?
- How should we handle dependencies between parameters (e.g., if one parameter's valid range depends on another parameter's value)?
