# Task: [Task Title]

- **Status:** Not Started | In Progress | In Review | Done
- **Assignee:** Unassigned
- **Priority:** High | Medium | Low
- **Creation Date:** YYYY-MM-DD
- **Related Epic/Feature:** [Link to parent feature, if any]

---

## 1. Overview & Goal

\*[Provide a clear, concise summary of the task. What is the primary objective? What user story or technical requirement does this task fulfill?]

## 2. Architectural Context

_[This section connects the task to the project's established architecture. Refer to the main architectural documents.]_

- **Relevant Architectural Document:** [Link to ARCHITECTURE.md](./../architecture/ARCHITECTURE.md)
- **Key Architectural Principles to Uphold:**
  - [ ] **ECS Compliance:** Does this task involve creating new Components or Systems? If so, they must adhere to the ECS pattern.
  - [ ] **Plugin Modularity:** If this task is part of a plugin, it must be fully self-contained within its plugin directory.
  - [ ] **Decoupling:** Ensure logic remains decoupled (e.g., simulation vs. rendering, systems communicating via components).
  - [ ] **Data-Driven Design:** Changes should be driven by data where possible (e.g., component properties, configuration files).

## 3. Technical Requirements & Implementation Plan

_[Provide a detailed, step-by-step plan for implementation. Break down the problem into smaller, manageable steps.]_

1.  **File(s) to be Created/Modified:**

    - `src/core/new-file.ts`
    - `src/plugins/my-plugin/system.ts`

2.  **Step-by-Step Implementation:**

    - Step 1: Define the new `MyComponent` data structure in `components.ts`.
    - Step 2: Implement the `MySystem` logic to operate on entities with `MyComponent`.
    - Step 3: Register the new component and system within the plugin's `register` method.
    - Step 4: ...

3.  **Dependencies:**
    - Does this task depend on any other ongoing tasks? [Link to task]
    - Does this task introduce new third-party libraries? (Requires approval).

## 4. Acceptance Criteria

_[Define a clear, verifiable checklist of conditions that must be met for the task to be considered complete. These should be testable.]_

- [ ] The new `MyComponent` can be added to an entity.
- [ ] The `MySystem` correctly updates the state of `MyComponent` each frame.
- [ ] The changes are reflected in the UI property inspector when an entity with `MyComponent` is selected.
- [ ] The simulation remains stable and performant.
- [ ] All new code is formatted correctly and passes the linter.

## 5. Testing Plan

_[A testing plan is mandatory. All code must be tested. Refer to the testing strategy in the architecture document.]_

- **Unit Tests:**
  - [ ] Test the internal logic of `MySystem` in isolation.
  - [ ] Verify the default state of a new `MyComponent`.
- **Integration Tests:**
  - [ ] Test that `MySystem` correctly retrieves and updates components from the `ComponentManager`.
  - [ ] Verify that the plugin correctly registers the new component and system with the `World`.
- **End-to-End (E2E) Tests:**
  - [ ] Create an E2E test that simulates a user adding an entity with `MyComponent` and verifying the expected outcome in the viewport.

## 6. UI/UX Considerations (If Applicable)

_[Describe any changes or additions to the user interface. Include mockups or descriptions of new controls.]_

- A new slider labeled "Intensity" will be added to the property inspector for `MyComponent`.
- The slider should have a range of 0 to 100.

## 7. Notes & Open Questions

_[Use this section for any additional comments, potential risks, or questions that need clarification before or during development.]_

- Is the proposed data structure for `MyComponent` optimal for performance?
- ...
