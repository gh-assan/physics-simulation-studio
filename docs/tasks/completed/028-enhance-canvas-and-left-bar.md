# Task: Enhance Canvas and Left Bar

- **Status:** Not Started
- **Assignee:** Unassigned
- **Priority:** High
- **Creation Date:** 2025-07-11
- **Related Epic/Feature:** UI Improvements

---

## 1. Overview & Goal

The goal of this task is to enhance the visual presentation of the canvas and improve the usability of the left bar in the Physics Simulation Studio. The canvas should appear as a contained, standalone area, visually separated from other UI elements. Additionally, the left bar should have meaningful group labels, and its width should be adjustable to improve user experience.

## 2. Technical Requirements & Implementation Plan

### Implementation Plan

1. **File(s) to be Created/Modified:**
    - `src/studio/ui/CanvasContainer.ts` (create)
    - `src/studio/ui/LeftBar.ts` (modify)
    - `src/styles/canvas.css` (create)
    - `src/styles/left-bar.css` (modify)

2. **Steps:**
    - **Step 1:** Create a `CanvasContainer` component.
      - Add a visual border or shadow around the canvas to separate it from other UI elements.
      - Ensure the canvas is responsive and scales appropriately with the window size.
      - Add padding or margins to create a clean, contained look.
    - **Step 2:** Update the left bar group labels.
      - Review and replace existing group labels with meaningful, descriptive names.
      - Ensure labels are concise and relevant to the grouped items.
    - **Step 3:** Make the left bar width adjustable.
      - Add a resizable handle to the left bar.
      - Implement drag-to-resize functionality.
      - Persist the adjusted width in `localStorage` for user preference.
    - **Step 4:** Update styles for the canvas and left bar.
      - Use consistent spacing and alignment to match the design system.
      - Ensure WCAG 2.2 AA compliance for contrast and accessibility.

## 3. Acceptance Criteria

- [ ] The canvas is visually separated from other UI elements with a contained, standardized view.
- [ ] Left bar group labels are meaningful and descriptive.
- [ ] The left bar width is adjustable and persists across sessions.
- [ ] Styles for the canvas and left bar are consistent with the design system.
- [ ] The solution is responsive and works across different screen sizes.

## 4. Testing Plan

- **Unit Tests:**
  - [ ] Test the `CanvasContainer` component for responsiveness and visual separation.
    - Verify that the canvas is visually separated with a border or shadow.
    - Check that the canvas scales correctly with different window sizes.
    - Ensure padding and margins are applied as expected.
  - [ ] Test the left bar resizing functionality.
    - Verify that the resizable handle works as intended.
    - Check that the adjusted width is saved and restored from `localStorage`.
- **Integration Tests:**
  - [ ] Verify that the canvas and left bar integrate seamlessly with the existing UI.
    - Ensure no overlap or misalignment occurs between the canvas and left bar.
  - [ ] Verify that updated group labels are displayed correctly.
    - Check that all group labels are meaningful and match the intended functionality.
- **Manual Testing:**
  - [ ] Test the canvas appearance on different screen sizes.
    - Verify that the canvas remains visually distinct and responsive.
  - [ ] Test the left bar resizing and label updates.
    - Ensure resizing does not interfere with other UI elements.
    - Confirm that group labels are clear and descriptive.

---

## Notes

- Follow the "Workspace first" principle: the canvas should remain the focal point of the UI.
- Ensure that the left bar resizing does not interfere with other UI elements.
- Use meaningful labels that align with the terminology used in the application.
