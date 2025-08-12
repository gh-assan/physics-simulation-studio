# Task: Analyze and Fix Solar System Plugin Rendering Issue

## Motivation
Planets are not shown in the Solar System simulation. The root cause is unclear, and there is confusion about how rendering is handled for new simulation plugins.

## Analysis
- The plugin creates entities with `RenderableComponent` using geometry type `'sphere'`.
- The main render system may not support or recognize `'sphere'` as a valid geometry type.
- No custom renderer is registered for the solar system.
- There is a lack of documentation about supported geometry types and how to extend rendering.
- The plugin assumes that adding a `RenderableComponent` is sufficient for rendering, which may not be true.

## Root Causes
1. Lack of contract/documentation for supported geometry types in the render system.
2. No mechanism for plugins to register custom renderers or geometry handlers.
3. Confusion between data (components) and behavior (systems/renderers).
4. No validation or feedback when an unsupported geometry type is used.
5. Possible camera/frustum or initialization order issues.

## Recommendations
- Document all supported geometry types in the render system.
- Allow plugins to register custom renderers or geometry handlers.
- Add validation and warnings for unsupported geometry types.
- Provide clear examples and guidelines for plugin authors.
- Review initialization order to ensure entities are rendered after creation.

## Acceptance Criteria
- Planets are visible in the solar system simulation.
- The render system supports or can be extended to support new geometry types.
- Plugin authors have clear documentation and examples.
- Validation is in place for unsupported geometry types.
- The root cause of the current issue is fixed and documented.

---

**Task created by GitHub Copilot on 1 August 2025**
