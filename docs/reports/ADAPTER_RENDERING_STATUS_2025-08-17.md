# Adapter Rendering Migration — Status Report (2025-08-17)

## Summary

We migrated runtime rendering to a single, adapter-centric path that bridges plugin renderers to Three.js via `RenderSystemAdapter` and `ThreeGraphicsManager`. All tests and lint pass. The simulation selector and plugin discovery are verified by unit tests. Legacy “simplified rendering” manager/system/interfaces are no longer used at runtime and can be removed.

## Architecture snapshot

- Core runtime
  - `src/studio/rendering/RenderSystemAdapter.ts`
  - `src/studio/rendering/createAdapterRenderSystem.ts`
  - `src/studio/graphics/ThreeGraphicsManager.ts`
- Orchestration
  - `src/studio/Studio.ts`, `src/studio/SimulationOrchestrator.ts`, `src/studio/simulation/SimulationManager.ts`
- Plugins
  - Flag: `src/plugins/flag-simulation/SimplifiedFlagRenderer.ts` (legacy-style API, consumed by adapter)
  - Water: `src/plugins/water-simulation/SimplifiedWaterRenderer.ts` (updated to adapter-compatible shape)
- Discovery + selector (UI data)
  - `src/studio/plugins/PluginDiscoveryService.ts`
  - `src/studio/Studio.getAvailableSimulationNames()` (data source for selector)

## Status checklist

- Adapter-only runtime in place: Done
- Studio/Orchestrator/SimulationManager wired to adapter: Done
- Flag renderer compatible with adapter: Done
- Water renderer compatible with adapter: Done (removed dependency on `simplified` interfaces)
- Simulation selector data source tested: Done
- Plugin discovery logic tested: Done
- Remove legacy simplified rendering files: Pending (no runtime usage; safe to delete)
- Optional UI test for selector updating on PLUGIN_REGISTERED: Deferred (low risk)
- Docs refresh: In progress (this report + deprecation banner on old plan)

## What’s left (actionable steps)

1) Remove unused legacy files and folders:
   - `src/studio/rendering/simplified/SimplifiedRenderSystem.ts`
   - `src/studio/rendering/simplified/SimplifiedRenderManager.ts`
   - `src/studio/rendering/simplified/SimplifiedInterfaces.ts`
   - `src/studio/rendering/simplified/interfaces.ts`
   - `src/studio/rendering/simplified/index.ts`
   - `src/studio/rendering/simplified/__tests__/SimplifiedRenderManager.test.ts`

2) Clean references and examples that import or mention the legacy stack:
   - HTML demos importing `SimplifiedRenderSystem`:
     - `flag-conditional-test.html`
     - `flag-visibility-test.html`
   - Documentation pages citing the legacy stack (update or add deprecation notes):
     - `docs/architecture/SIMPLIFIED_RENDERING_PLAN.md`
     - `docs/architecture/RENDERING_COMPLEXITY_ASSESSMENT.md`
     - `docs/reports/migrations/*` that still present simplified as target
   - Comments in tests mentioning `SimplifiedRenderSystem` (cosmetic; keep or modernize gradually)

3) Optional extras (nice-to-have):
   - Add a small UI test: simulate `PLUGIN_REGISTERED` and assert selector options refresh.
   - Author a brief Adapter Architecture README under `docs/architecture/ADAPTER_RENDERING_PLAN.md`.

## Tests covering the new path

- Adapter wiring and selection
  - `src/studio/tests/RenderSystemWiring.test.ts`
  - `src/studio/tests/RenderSystemSelection.test.ts`
  - `test/integration/studio-render-system-integration.test.ts`
- Simulation selector and discovery
  - `src/studio/tests/SimulationSelectorData.test.ts`
  - `src/studio/tests/PluginDiscoveryService.test.ts`
- Renderer compatibility
  - `test/integration/renderer-registration-investigation.test.ts`
  - `test/integration/flag-renderer-compatibility.test.ts`
  - Water plugin tests under `src/plugins/water-simulation/tests/*`

All suites are green per latest run: 91 passed, 0 failed (3 skipped), lint OK.

## How to continue (step-by-step)

- Step 1 — Delete legacy files listed above and run the safety check. Verify zero build/test regressions.
- Step 2 — Update or remove HTML demos that import legacy `SimplifiedRenderSystem`. Replace with adapter setup if those demos are still used.
- Step 3 — Sweep docs: mark legacy plan deprecated; point to adapter plan; keep a short migration note for historical context.
- Step 4 — (Optional) Add UI-level selector refresh test; keep as low priority.

## Notes and risks

- The class name `SimplifiedFlagRenderer` remains, but it’s now just a legacy-style renderer shape that the adapter calls via `render(context)`. It’s safe and tested.
- The adapter renders a Three.js frame only when a legacy-style renderer actually performs work (didRender flag). This keeps cadence efficient in tests.
- TypeScript lint warning about supported version is pre-existing and non-blocking.

---

Owner: gh-assan
Branch: simplify-things-17
Date: 2025-08-17
