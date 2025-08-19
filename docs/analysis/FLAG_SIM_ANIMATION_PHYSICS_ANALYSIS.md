# Visual Debug Checklist

- [ ] Flag mesh appears in the scene
- [ ] Flag mesh moves/animates over time
- [ ] Flag responds to wind/parameter changes
- [ ] No visual artifacts or errors in the console

# Failure Modes Table

| Symptom                        | Likely Cause                                 | Suggested Debug Step                |
|--------------------------------|----------------------------------------------|-------------------------------------|
| Flag not visible               | Renderer not registered, scene/camera issue  | Check renderer registration, logs   |
| Flag visible but static        | Physics system not updating                  | Add debug logs to physics system    |
| Flag animates, but glitches    | Mesh update order, data race, bad indices    | Check update order, mesh logic      |
| No animation, no errors        | Animation loop not running, early return     | Check main loop, add frame logs     |
| Flag responds to nothing       | Parameter wiring broken                      | Check parameter panel, logs         |

# Traceability Matrix

| Success Criterion                        | Code Module/File                        | Test/Log/Output                    |
|------------------------------------------|-----------------------------------------|-------------------------------------|
| Flag animates and updates                | FlagSimulationSystem, FlagComponent     | Animation loop, debug logs         |
| Renderer draws flag mesh                 | SimplifiedFlagRenderer                  | Render logs, visual output         |
| Animation loop triggers world update     | main.ts, Studio.update                  | Frame logs, animation test         |
| System registration explicit             | main.ts, plugin index.ts                | System registration logs           |
| Safe commit after every change           | Protocol, commit history                | Commit log, protocol check         |

# Protocol Step Outcomes

| Protocol Step              | Pass Criteria                                 | Fail Criteria                       |
|---------------------------|-----------------------------------------------|-------------------------------------|
| Pre-Change Safety Check   | No errors/warnings in output                  | Any error/warning in output         |
| TDD (Failing Test First)  | Test fails before code change                 | Test passes or not present          |
| Minimal Code Change       | Only code needed to pass test is changed      | Unrelated code changes              |
| Validation                | All tests pass, no regressions                | Any test fails                      |
| Safe Commit               | Commit with clear message, protocol followed  | No commit or unclear message        |

# Next Actions Log

| Date       | Action/Investigation Step                | Outcome/Notes                        |
|------------|-----------------------------------------|--------------------------------------|

# Known Gaps or Risks

- ECS update order may be implicit—should be made explicit in code/docs
- Some errors may be swallowed by catch blocks—ensure all critical failures are logged
- Test coverage for edge cases (e.g., rapid parameter changes) may be incomplete


# Workspace Protocols (for all changes)

All changes and investigations must strictly follow these protocols:

1. **Pre-Change Safety Check:**
   - Run `npm run pre-change` before making any code changes.
   - See: [docs/development/protocols/assistant-protocol.md](../development/protocols/assistant-protocol.md)
2. **Test-Driven Development:**
   - Write or update failing tests before implementing fixes.
   - See: [docs/development/protocols/tdd-protocol.md](../development/protocols/tdd-protocol.md)
3. **Minimal Code Change:**
   - Make the smallest change necessary to pass the tests.
4. **Validation:**
   - Run all tests to ensure correctness and no regressions.
5. **Safe Commit:**
   - Always perform a safe commit with a clear, descriptive message after every change.
   - See: [docs/development/protocols/assistant-protocol.md#safe-commit](../development/protocols/assistant-protocol.md#safe-commit)

These steps must be followed for every investigation, bug fix, or feature addition to ensure reliability, traceability, and maintainability.

# Flag Simulation Animation/Physics Update Analysis (19 Aug 2025)

## Problem Statement
- The flag is now visible, but the simulation (animation/physics update) is not running.
- The flag mesh does not animate or respond to physics as expected.

## Observed Symptoms
- Flag mesh is static after renderer fix.
- No visible animation or physics-driven movement.
- All tests pass, but runtime behavior is incorrect.

## Technical Context
- **Renderer:** `SimplifiedFlagRenderer` implements both minimal and legacy interfaces. `update()` is a no-op; `render(context)` draws the flag mesh.
- **Adapter:** `RenderSystemAdapter` now calls `render(context)` for minimal renderers.
- **Animation Loop:** Animation loop and rendering chain are confirmed working by tests.
- **Physics:** Physics update is expected to be driven by the ECS/world update, which should update flag component state each frame.

## Hypotheses
1. **Physics system is not updating flag components:**
   - The ECS/world update may not be stepping the flag simulation system.
2. **FlagSimulationSystem is not registered or not running:**
   - The system responsible for updating flag physics may not be present in the world.
3. **Flag component data is not changing:**
   - The flag's points/vertices are not being updated by physics.
4. **Animation loop is not triggering world update:**
   - The main animation loop may not be calling `studio.update()` or `world.update()` as expected.
5. **Order of system updates is incorrect:**
   - Render system may be running before physics system, so mesh is always static.

## Investigation Plan
1. **Verify animation loop and world update:**
   - Confirm that `studio.update()` calls `world.update()` each frame.
2. **Check system registration:**
   - Ensure `FlagSimulationSystem` (or equivalent) is registered with the world.
3. **Check system update order:**
   - Confirm physics system runs before render system.
4. **Check flag component mutation:**
   - Add debug logs to flag system and renderer to verify if flag points are changing.
5. **Check for errors or early returns:**
   - Look for silent failures or conditions that prevent physics update.


## Success Criteria

To consider the flag simulation animation/physics update successful, the following criteria must be met:

### 1. Functional
- [ ] The flag mesh is visible and animates smoothly in response to physics updates.
- [ ] Physics system updates flag component data every frame (points/vertices change over time).
- [ ] Animation loop triggers world and system updates as expected.

### 2. Debuggability
- [ ] Key systems (animation loop, physics, renderer) have clear, minimal debug logging for state changes and errors.
- [ ] It is easy to verify, via logs or dev tools, that physics and rendering are running and updating entities.
- [ ] Any failure in the update chain (e.g., missing system, early return) is surfaced with a clear error or warning.

### 3. Design & Maintainability
- [ ] System registration and update order are explicit and easy to trace in code.
- [ ] Each system (physics, renderer, etc.) has a clear, single responsibility and minimal coupling.
- [ ] The code is modular, with well-defined interfaces for systems and renderers.
- [ ] Adding or debugging a new simulation system is straightforward (clear extension points, minimal boilerplate).

### 4. Testability
- [ ] There are targeted tests for animation loop, system registration, and flag physics update.
- [ ] Tests can catch regressions in animation, physics, or rendering.

### 5. Documentation
- [ ] The code and this document are updated to reflect the final architecture and debug approach.

---

*This document will be updated as the investigation proceeds. See also: previous rendering/adapter analysis.*
