# Task: Implement Viewport Toolbar

- **Status:** Not Started
- **Assignee:** Unassigned
- **Priority:** High
- **Creation Date:** 2025-07-11
- **Related Epic/Feature:** UI Improvements

---

## 1. Overview & Goal

The goal of this task is to implement a viewport toolbar for the Physics Simulation Studio. This toolbar will provide quick access to common tools and settings within the 3D canvas.

## 2. Technical Requirements & Implementation Plan

### Implementation Plan

1. **File(s) to be Created/Modified:**
    - `src/studio/ui/ViewportToolbar.ts` (create)
    - `src/studio/ui/ToolbarButton.ts` (create)

2. **Steps:**
    - **Step 1:** Create a `ViewportToolbar` component.
      - Include buttons for Select, Move, Rotate, Scale, etc.
      - Add toggles for grid and snap settings.
    - **Step 2:** Create a `ToolbarButton` component.
      - Support hover, active, and disabled states.
    - **Step 3:** Integrate the toolbar into the 3D canvas.
      - Position it as an overlay in the top-left corner.
    - **Step 4:** Add keyboard shortcuts for toolbar actions.
      - E.g., Q for Select, W for Move, E for Rotate, R for Scale.

## 3. Acceptance Criteria

- [ ] Toolbar is visible and functional within the 3D canvas.
- [ ] Buttons support hover, active, and disabled states.
- [ ] Keyboard shortcuts for toolbar actions are implemented.
- [ ] Toolbar integrates seamlessly with the existing UI.

## 4. Testing Plan

- **Unit Tests:**
  - [ ] Test button states and interactions.
- **Integration Tests:**
  - [ ] Verify toolbar functionality within the 3D canvas.
- **Manual Testing:**
  - [ ] Test keyboard shortcuts for toolbar actions.

---

## Notes

- Follow industry-standard shortcuts (e.g., QWER for Select/Move/Rotate/Scale).
- Ensure that the toolbar does not obstruct the 3D canvas.
