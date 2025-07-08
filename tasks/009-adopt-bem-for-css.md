# Task: Adopt BEM (Block-Element-Modifier) for CSS

- **Status:** Not Started
- **Assignee:** Unassigned
- **Priority:** Medium
- **Creation Date:** 2025-07-08
- **Related Epic/Feature:** UI/UX Improvement

---

## 1. Overview & Goal

This task aims to refactor the project's CSS to adopt the BEM (Block-Element-Modifier) methodology. The primary goal is to improve the organization, readability, and maintainability of our stylesheets by providing a strict, clear naming convention for CSS classes. This will make it easier to understand the purpose of each class, prevent naming conflicts, and facilitate collaboration.

## 2. Architectural Context

Adopting BEM is a stylistic and organizational architectural decision for the frontend. It directly impacts how CSS is written and structured, promoting modularity and reusability of UI components.

- **Relevant Architectural Document:** [Link to ARCHITECTURE.md](./../architecture/ARCHITECTURE.md) (Will be updated to reflect this decision)
- **Key Architectural Principles to Uphold:**
  - [x] **Modularity:** BEM inherently promotes modular, independent UI components.
  - [x] **Consistency:** Enforces a consistent naming convention across all stylesheets.
  - [ ] **Decoupling:** Helps decouple styles from specific HTML structure, making components more reusable.

## 3. Technical Requirements & Implementation Plan

### 1. File(s) to be Created/Modified:

-   `src/studio/styles/studio.css`
-   `index.html` (if any class names are directly in HTML)
-   `src/studio/main.ts` (if any class names are manipulated in JS)
-   Any other `.css` files or files containing CSS class names.

### 2. Step-by-Step Implementation:

1.  **Define BEM Naming Conventions:** Establish clear guidelines for Blocks, Elements, and Modifiers specific to this project (e.g., `block-name__element-name--modifier-name`).
2.  **Refactor `studio.css`:**
    *   Go through `studio.css` and identify existing classes that can be converted to BEM.
    *   For Tweakpane-related styles, consider if custom classes can be added to Tweakpane elements (if supported) or if existing Tweakpane classes need to be wrapped in a BEM block.
    *   Example: Instead of `.tp-btnv button`, consider a custom block like `.studio-button` with modifiers.
3.  **Update Corresponding HTML/JS:** Wherever the refactored CSS class names are used in `index.html` or JavaScript files (e.g., `main.ts`), update them to the new BEM class names.
4.  **Review and Test:** Manually review all affected files to ensure correct class name application and verify that no visual regressions have occurred.

### 3. Dependencies:

-   None, this is a refactoring task.

## 4. Acceptance Criteria

-   [ ] All custom CSS classes in `src/studio/styles/studio.css` (and any other relevant CSS files) adhere to the defined BEM naming conventions.
-   [ ] The application's UI remains visually identical to its state before the refactoring (no visual regressions).
-   [ ] The CSS codebase is more organized and easier to understand.
-   [ ] No new console errors related to missing styles or incorrect class names.

## 5. Testing Plan

-   **Manual Visual Inspection:**
    -   Open the studio in a web browser.
    -   Thoroughly inspect all UI elements, especially those styled by `studio.css`, to ensure their appearance is unchanged.
    -   Interact with all controls and simulations to confirm functionality and visual integrity.

## 6. UI/UX Considerations

-   This task is primarily a code organization improvement and should not directly impact the end-user UI/UX, other than potentially improving future development speed and consistency.

## 7. Notes & Open Questions

-   How strictly should BEM be applied to third-party library classes (like Tweakpane's internal classes)? For now, focus on custom classes and use Tweakpane's classes as context selectors where necessary.
