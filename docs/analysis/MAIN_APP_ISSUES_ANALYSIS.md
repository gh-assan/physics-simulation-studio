# Main App Issues Analysis & Fix Plan

**Date:** August 17, 2025  
**Status:** Draft Analysis  
**Issues:** Sim selector empty/not shown, simulation itself not shown  

## 🔍 Current State Analysis

### Issues Identified

1. **Simulation Selector Empty/Not Shown**
   - Simulation selector UI exists in code (`main.ts:125-180`)
   - Uses Tweakpane folder with dropdown binding
   - Depends on `studio.getAvailableSimulationNames()` returning data
   - Should auto-populate when plugins register

2. **Simulation Not Shown**
   - Animation loop exists and calls `studio.update(deltaTime)` (`main.ts:250-257`)
   - Diagnostic tests indicate rendering chain is set up correctly
   - Issue likely in render system or renderer registration

## 🧪 Diagnostic Evidence (From Pre-Change Check)

### ✅ What's Working
- Animation loop exists and calls `studio.update()`
- `studio.update()` calls `world.update()`
- `world.update()` calls `systemManager.updateAll()`
- `SimplifiedRenderSystem` is registered as a system
- Play button works - simulation loads and starts
- RenderSystem is registered with world

### ❓ Potential Issues
- `systemManager.updateAll()` may not be calling `SimplifiedRenderSystem.update()`
- `SimplifiedRenderSystem.update()` may not find any renderers to call
- Flag simulation may not register its renderer properly
- Canvas visibility or Three.js setup issue

### 🔧 Key Findings from Diagnostics
```
❌ MISSING: Animation loop calling Studio.update()!
```
**Wait - this is contradictory!** The code shows animation loop exists, but diagnostics say it's missing.

## 📁 File Structure Analysis

### Main Application Entry Point
- **File:** `src/studio/main.ts`
- **HTML:** `index.html` 
- **Left Panel:** `<div id="left-panel">` - contains Tweakpane UI
- **Main Content:** `<div id="main-content">` - should contain canvas

### UI Structure
```
index.html
├── left-panel (Tweakpane controls)
│   ├── Global Controls (Play/Pause buttons)
│   ├── Simulations (dropdown selector)
│   └── Plugin Parameters (dynamic)
├── resize-handle
└── main-content (Three.js canvas)
```

### Key Code Sections
1. **Simulation Selector** (`main.ts:125-180`)
2. **Animation Loop** (`main.ts:248-257`)
3. **Plugin System** (PluginManager, auto-discovery)
4. **Render System** (ThreeGraphicsManager, SimplifiedRenderSystem)

## 🎯 Root Cause Hypotheses

### Primary Hypothesis: Plugin Registration Issue
**Simulation selector is empty because:**
1. Plugins are not being discovered/registered automatically
2. `studio.getAvailableSimulationNames()` returns empty array
3. Selector shows "No simulations available" button

### Secondary Hypothesis: Canvas/Render Issue  
**Simulation not visible because:**
1. Canvas is not attached to DOM (`main-content` div)
2. Render system not calling Three.js render
3. Scene not properly set up

### Tertiary Hypothesis: Animation Loop Timing
**Based on diagnostics contradiction:**
1. Animation loop exists in code but may not be actually running
2. `startApplication(studio)` may not be called
3. Timing issue with initialization order

## 📋 Test-Driven Fix Plan

### Phase 1: Plugin Discovery & Simulation Selector
**Goal:** Get simulation selector populated with available simulations

**Tests to Write:**
1. `main-app-plugin-discovery.test.ts`
   ```typescript
   describe('Main App Plugin Discovery', () => {
     test('should discover and register flag simulation plugin', () => {
       // Test that plugin auto-discovery works
       // Verify studio.getAvailableSimulationNames() includes 'flag-simulation'
     });
     
     test('should populate simulation selector dropdown', () => {
       // Test that UI selector gets options
       // Verify dropdown is not empty
     });
   });
   ```

2. `simulation-selector-ui.test.ts`
   ```typescript
   describe('Simulation Selector UI', () => {
     test('should show dropdown with available simulations', () => {
       // Mock plugins, verify UI shows options
     });
     
     test('should handle simulation selection change', () => {
       // Test that selecting simulation calls studio.loadSimulation()
     });
   });
   ```

**Implementation Steps:**
1. Verify plugin auto-discovery is working
2. Debug `studio.getAvailableSimulationNames()`
3. Check PluginManager event listening
4. Fix simulation selector update logic

### Phase 2: Animation Loop & Canvas Setup
**Goal:** Ensure animation loop runs and canvas is visible

**Tests to Write:**
1. `animation-loop-integration.test.ts`
   ```typescript
   describe('Animation Loop Integration', () => {
     test('should start animation loop on app initialization', () => {
       // Verify requestAnimationFrame is called
       // Mock RAF and check studio.update() calls
     });
     
     test('should update studio with correct deltaTime', () => {
       // Test timing calculations
     });
   });
   ```

2. `canvas-setup.test.ts`
   ```typescript
   describe('Canvas Setup', () => {
     test('should attach Three.js canvas to main-content div', () => {
       // Verify DOM manipulation
       // Check canvas element exists and is visible
     });
     
     test('should have proper canvas sizing', () => {
       // Test responsive canvas
     });
   });
   ```

**Implementation Steps:**
1. Verify `startApplication(studio)` is called
2. Check Three.js canvas creation and DOM attachment
3. Debug render system update chain
4. Add animation loop diagnostics

### Phase 3: Renderer Registration & Rendering Chain
**Goal:** Ensure simulations render visually

**Tests to Write:**
1. `renderer-registration-flow.test.ts`
   ```typescript
   describe('Renderer Registration Flow', () => {
     test('should register plugin renderers with render system', () => {
       // Test end-to-end renderer registration
       // Verify SimplifiedRenderManager has renderers
     });
     
     test('should call renderer.render() during update cycle', () => {
       // Mock renderer, verify render() is called
     });
   });
   ```

**Implementation Steps:**
1. Add logging to SimplifiedRenderSystem.update()
2. Verify renderer.canRender() implementations
3. Check Three.js scene.add() calls
4. Debug canvas visibility

## 🔧 Specific Implementation Areas

### Files to Examine/Fix:
1. **`src/studio/main.ts`** - Main entry point, animation loop
2. **`src/studio/Studio.ts`** - getAvailableSimulationNames() method
3. **`src/core/plugin/PluginManager.ts`** - Plugin discovery
4. **`src/studio/graphics/ThreeGraphicsManager.ts`** - Canvas setup
5. **`src/studio/rendering/SimplifiedRenderSystem.ts`** - Render loop

### Key Methods to Debug:
1. `studio.getAvailableSimulationNames()`
2. `pluginManager.getActivePlugins()`
3. `renderSystem.update()`
4. `graphicsManager.createCanvas()`

## 📊 Success Criteria

### Phase 1 Success:
- [ ] Simulation selector dropdown shows "flag-simulation" option
- [ ] Selecting simulation updates state correctly
- [ ] Play button becomes enabled when simulation selected

### Phase 2 Success:
- [ ] Canvas element exists in DOM under main-content
- [ ] Animation loop runs at 60fps
- [ ] studio.update() called every frame

### Phase 3 Success:
- [ ] Flag simulation visually renders (flag waving)
- [ ] Scene has visible objects
- [ ] Render system logs show active rendering

## 🚨 Risk Assessment

**Low Risk:**
- Plugin discovery fixes (isolated system)
- UI selector improvements (visual only)

**Medium Risk:**
- Animation loop changes (could break existing flow)
- Canvas setup modifications (could affect other systems)

**High Risk:**
- Render system core changes (affects all rendering)
- Three.js integration modifications (complex dependencies)

## 📝 Next Steps

1. **Write failing tests** for Phase 1 (simulation selector)
2. **Debug plugin discovery** - why no simulations available?
3. **Verify animation loop** - resolve diagnostic contradiction
4. **Check canvas DOM attachment** - is Three.js canvas visible?
5. **Add render system logging** - trace rendering call chain

---

**Note:** This analysis follows TDD protocol - all fixes will be implemented test-first with small, incremental changes.
