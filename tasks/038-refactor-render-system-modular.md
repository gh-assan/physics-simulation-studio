# Task: Refactor RenderSystem into Modular Systems

## Motivation
The current `RenderSystem` is too complex and mixes multiple responsibilities: general mesh rendering, flag rendering, pole rendering, water droplet debug rendering, selection logic, and plugin renderer delegation. This makes the code hard to maintain, extend, and test.

## Goals
- Split rendering logic into smaller, focused systems.
- Move selection and event handling out of the renderer.
- Decouple plugin-specific logic.
- Improve maintainability, extensibility, and testability.

## Proposed Structure
- **GeneralMeshRenderSystem**: Renders entities with `PositionComponent`, `RotationComponent`, and `RenderableComponent`.
- **FlagRenderSystem**: Handles entities with `FlagComponent`.
- **PoleRenderSystem**: Handles entities with `PoleComponent`.
- **WaterDebugRenderSystem** (optional): Handles entities with `WaterDropletComponent` for debug visuals.
- **SelectionSystem**: Handles raycasting and selection logic.
- **PluginRendererManager**: Delegates rendering to plugin-specific renderers (e.g., `WaterRenderer`).
- **UIController**: Handles event listeners and triggers updates/selection.

## Steps
1. Create new system files in `src/studio/systems/` for each responsibility.
2. Move relevant logic from `RenderSystem` to the new systems.
3. Refactor mesh management so each system manages its own meshes and cleanup.
4. Move event listeners (mouse, parameter-changed) to a UI/controller class.
5. Update the main `Studio` class to coordinate system updates and clearing.
6. Ensure plugin renderer delegation is handled by a manager or the studio.
7. Write tests for each new system.
8. Remove unused code from the old `RenderSystem`.

## Acceptance Criteria
- Each system is in its own file and only handles its specific responsibility.
- The main `Studio` class coordinates updates and clearing for all systems.
- Selection and event handling are moved out of the renderer.
- Plugin-specific rendering is decoupled and managed separately.
- All existing rendering features work as before.
- Code is easier to read, maintain, and extend.

## References
- Original `RenderSystem.ts` implementation
- ECS architecture best practices
- `task-template.md` for structure

---

**Task created by GitHub Copilot on 13 July 2025**
