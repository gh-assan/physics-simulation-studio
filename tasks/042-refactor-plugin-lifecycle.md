# Task: Refactor Plugin Lifecycle for Robust Control Flow

**Objective:** To fix the recurring rendering failures by refactoring the plugin lifecycle to eliminate the "double registration" bug.

**Background:** The current `PluginManager` registers plugin systems twice: once at startup and again on activation. This task will refactor the `PluginManager` and the `ISimulationPlugin` interface to separate the concepts of registration and activation, ensuring that systems are only registered once.

--- 

### Step 1: Modify the `ISimulationPlugin` Interface

**Goal:** Add a `getSystems()` method to the `ISimulationPlugin` interface.

**Implementation:**

1.  **Modify `src/core/plugin/ISimulationPlugin.ts`:**
    *   Add a new method to the interface: `getSystems(): System[];`

--- 

### Step 2: Update the `FlagSimulationPlugin`

**Goal:** Implement the `getSystems()` method in the `FlagSimulationPlugin`.

**Implementation:**

1.  **Modify `src/plugins/flag-simulation/index.ts`:**
    *   Implement the `getSystems()` method. This method should return an array containing instances of `FlagSystem` and `FlagRenderSystem`.
    *   **Crucially, remove the system registration calls from the `register()` method.** The `register()` method should now only be responsible for registering components.

--- 

### Step 3: Refactor the `PluginManager`

**Goal:** Modify the `PluginManager` to use the new `getSystems()` method.

**Implementation:**

1.  **Modify `src/core/plugin/PluginManager.ts`:**
    *   In the `activatePlugin` method, after activating the plugin, call the plugin's `getSystems()` method and register the returned systems with the `SystemManager`.
    *   In the `deactivatePlugin` method, get the plugin's systems and unregister them from the `SystemManager`.
    *   In the `registerPlugin` method, **remove the call to `plugin.register()`**. The `register` method will now only be called during activation.

--- 

### Step 4: Verification

**Goal:** Verify that the refactoring was successful and that the rendering issue is resolved.

**Implementation:**

1.  Run the application (`npm start`).
2.  Verify that the flag simulation loads and renders correctly by default.
3.  Switch to the "Water Simulation" and then back to the "Flag Simulation".
4.  Verify that the flag simulation still renders correctly after switching.

--- 

### Step 5: Clean Up

**Goal:** Clean up any remaining dead code or obsolete comments.

**Implementation:**

1.  Review the `PluginManager`, `FlagSimulationPlugin`, and `ISimulationPlugin` files for any comments or code that are now obsolete.
2.  Ensure the code is clean, well-formatted, and that all changes are consistent with the project's coding style.
