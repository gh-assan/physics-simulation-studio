# Task: Improve Studio UI/UX and Layout

- **Status:** Not Started
- **Assignee:** Unassigned
- **Priority:** High
- **Creation Date:** 2025-07-08
- **Related Epic/Feature:** Studio Enhancements

---

## 1. Overview & Goal

This task aims to significantly improve the overall User Interface (UI) and User Experience (UX) of the Physics Simulation Studio. The primary objective is to create a clean, intuitive, and visually appealing layout that clearly separates global controls from simulation-specific parameters, and ensures a cohesive aesthetic. This will enhance usability and make the studio more pleasant to interact with.

## 2. Architectural Context

UI/UX improvements should be implemented with a strong emphasis on decoupling presentation from core application logic. The existing `tweakpane` library will be utilized for controls, and styling will primarily be handled via CSS.

- **Relevant Architectural Document:** [Link to ARCHITECTURE.md](./../architecture/ARCHITECTURE.md)
- **Key Architectural Principles to Uphold:**
  - [x] **Decoupling:** UI components and styling must remain separate from the core ECS and simulation logic.
  - [x] **Modularity:** New UI elements should be organized logically (e.g., dedicated CSS files, UI-specific modules).
  - [x] **Extensibility:** The design should allow for easy addition of new UI elements or themes in the future.

## 3. Technical Requirements & Implementation Plan

### 1. File(s) to be Created/Modified:

-   `index.html` (for overall page structure and linking CSS)
-   `src/studio/main.ts` (for Tweakpane initialization and potentially new root UI elements)
-   `src/studio/styles/studio.css` (New: Dedicated CSS file for studio-wide styling)
-   `src/studio/uiManager.ts` (Potentially for abstracting complex UI interactions, though not strictly required for initial layout)

### 2. Step-by-Step Implementation:

1.  **Initial UI Review:** Analyze the current layout and identify specific areas for improvement (e.g., Tweakpane's default position, lack of clear visual hierarchy).

2.  **Create `studio.css`:**
    *   Create a new CSS file at `src/studio/styles/studio.css`.
    *   Link this CSS file in `index.html`.

3.  **Implement Basic Page Layout:**
    *   Modify `index.html` to define a clear structure, potentially using `div` elements for a main content area (for the Three.js canvas) and a sidebar/overlay for controls.
    *   Use CSS (in `studio.css`) to position the `tweakpane` container (which is typically appended to `document.body` by default) into a desired layout, e.g., a fixed sidebar on the left or right.

4.  **Customize Tweakpane Styling:**
    *   Utilize `tweakpane`'s theming options or override its default CSS classes within `studio.css` to match a more modern and integrated look.
    *   Adjust colors, fonts, spacing, and border-radii for a cleaner appearance.

5.  **Improve Visual Hierarchy:**
    *   Use CSS to add subtle visual separators or background colors to distinguish between the "Global Controls" folder and the "Simulations" folder, and between different simulation-specific control groups.
    *   Ensure consistent padding and margins.

6.  **Basic Responsiveness:**
    *   Add basic media queries to `studio.css` to ensure the layout remains usable on smaller screens (e.g., stacking controls vertically, adjusting font sizes).

### 3. Dependencies:

-   Existing: `tweakpane`
-   New: Standard CSS

## 4. Acceptance Criteria

-   [ ] The studio interface has a visually clean and organized layout.
-   [ ] Global controls (Play, Pause, Reset) are clearly visible and distinct from simulation-specific controls.
-   [ ] The simulation selection dropdown is easily accessible and functional.
-   [ ] The `tweakpane` controls are styled to integrate better with the overall studio aesthetic.
-   [ ] The layout adapts gracefully to basic window resizing (e.g., from desktop to a narrower view).
-   [ ] No new functional bugs are introduced in the simulation or controls.
-   [ ] All new CSS and TypeScript code adheres to project style guidelines.

## 5. Testing Plan

-   **Manual Visual Inspection:**
    -   Open the studio in a web browser.
    -   Resize the browser window to various dimensions (wide, narrow, tall) to check responsiveness.
    -   Interact with all global controls (Play, Pause, Reset) and the simulation selection dropdown.
    -   Select the flag simulation and verify its specific controls appear and are functional.
    -   Observe the overall aesthetic and ensure readability and ease of use.

-   **No Automated UI Tests:** For this initial UI/UX improvement task, automated UI tests are not within scope.

## 6. UI/UX Considerations

-   **Minimalist Design:** Aim for a clean, uncluttered interface.
-   **Color Palette:** Use a limited, harmonious color palette. Consider a dark theme for a modern look, or a light theme with good contrast.
-   **Typography:** Choose a readable font and ensure appropriate font sizes for different elements.
-   **Consistency:** Maintain consistent spacing, alignment, and visual elements throughout the UI.

## 7. Notes & Open Questions

-   Should we consider a more advanced UI framework (e.g., React, Vue) for future, more complex UI features? (Out of scope for this task, but worth noting for future planning).
-   Specific color scheme preferences (e.g., dark mode by default)? For now, I will implement a basic clean theme.
