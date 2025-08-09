import { IPluginManager } from '../core/plugin/IPluginManager';
import { IWorld } from "../core/ecs/IWorld";
import { World } from '../core/ecs/World';
import { Logger } from "../core/utils/Logger";
import { SimplifiedRenderSystem } from './rendering/simplified/SimplifiedRenderSystem';
import { IStudio } from './IStudio';
import { ISimulationOrchestrator } from './ISimulationOrchestrator';
import { IRenderer } from './rendering/simplified/SimplifiedInterfaces';
import * as THREE from 'three';

export class SimulationOrchestrator implements ISimulationOrchestrator {
    private world: IWorld;
    private pluginManager: IPluginManager;
    private renderSystem: SimplifiedRenderSystem | null = null;
    private studio: IStudio;

    constructor(world: IWorld, pluginManager: IPluginManager, studio: IStudio) {
        this.world = world;
        this.pluginManager = pluginManager;
        this.studio = studio;
    }

    public async loadSimulation(pluginName: string): Promise<void> {
        this._deactivateCurrentSimulation(pluginName);
        this._clearWorldAndRenderSystem();
        try {
            await this.pluginManager.activatePlugin(pluginName, this.studio);
            Logger.getInstance().log(`Loaded simulation: ${pluginName}`);

            const activePlugin = this.pluginManager.getPlugin(pluginName);

            // Register plugin renderer with SimplifiedRenderSystem
            if (this.renderSystem && activePlugin) {
                // First, check if plugin has a registerRenderer method (new style)
                if (typeof (activePlugin as any).registerRenderer === 'function') {
                    await (activePlugin as any).registerRenderer(this.world);
                    Logger.getInstance().log(`Registered ${pluginName} renderer via registerRenderer method`);
                }
                // Fallback to legacy getRenderer method
                else if (activePlugin.getRenderer) {
                    const pluginRenderer = activePlugin.getRenderer();
                    if (pluginRenderer && typeof pluginRenderer === 'object') {
                        // Check if it's a new-style IRenderer
                        if (pluginRenderer.name && pluginRenderer.canRender && pluginRenderer.render) {
                            this.renderSystem.registerRenderer(pluginRenderer as IRenderer);
                            Logger.getInstance().log(`Registered ${pluginName} renderer: ${pluginRenderer.name}`);
                        }
                    }
                }
            }

            if (activePlugin?.initializeEntities) {
                await activePlugin.initializeEntities(this.world);
                this.world.update(0);
                this.world.systemManager.updateAll(this.world, 0);
                if (this.renderSystem) {
                    this.renderSystem.update(this.world as World, 0);
                }
            }

            const event = new CustomEvent("simulation-loaded", {
                detail: { simulationName: pluginName }
            });
            window.dispatchEvent(event);
            Logger.getInstance().log(`Dispatched simulation-loaded event for ${pluginName}`);
        } catch (error: unknown) {
            Logger.getInstance().error(`Failed to load simulation:`, error);
        }
    }

    public unloadSimulation(activePluginName: string): void {
        if (!activePluginName) {
            throw new Error("Cannot unload simulation: plugin name is required");
        }
        this._deactivateCurrentSimulation(activePluginName);
        this._clearWorldAndRenderSystem();
        Logger.getInstance().log(`Simulation ${activePluginName} unloaded.`);
    }

    private _deactivateCurrentSimulation(activePluginName: string): void {
        if (!activePluginName) {
            throw new Error("Cannot deactivate simulation: plugin name is required");
        }

        // Clean up renderer before deactivating plugin
        const activePlugin = this.pluginManager.getPlugin(activePluginName);
        if (activePlugin && typeof (activePlugin as any).unregisterRenderer === 'function') {
            (activePlugin as any).unregisterRenderer();
            Logger.getInstance().log(`Unregistered ${activePluginName} renderer`);
        }

        // Deactivate plugin (calls unregister internally)
        this.pluginManager.deactivatePlugin(activePluginName, this.studio);
    }

    private _clearWorldAndRenderSystem(): void {
        console.log('🔄 Clearing everything for new simulation (clean slate approach)');

        // Clear the world entities but preserve systems - new simulation will populate fresh entities
        this.world.clear(false); // Preserve systems like SimplifiedRenderSystem

        // Clear the scene completely - higher level abstraction approach
        if (this.renderSystem) {
            const renderSystem = this.renderSystem as SimplifiedRenderSystem;
            const scene = renderSystem.getScene(); // Use proper method instead of private access

            // Clear all objects from scene
            while(scene.children.length > 0) {
                scene.remove(scene.children[0]);
            }

            // Re-add essential persistent objects (lights, camera helpers, etc.)
            this._addPersistentSceneObjects(scene);

            Logger.getInstance().log('🧹 Scene cleared and persistent objects restored');
        }
    }

    private _addPersistentSceneObjects(scene: THREE.Scene): void {
        try {
            // Add essential lighting that should persist across simulations
            const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(10, 10, 10);

            scene.add(ambientLight);
            scene.add(directionalLight);

            // Add coordinate system helper
            const axesHelper = new THREE.AxesHelper(5);
            scene.add(axesHelper);

            Logger.getInstance().log('✨ Added persistent scene objects (lights, helpers)');
        } catch (error) {
            Logger.getInstance().log('⚠️ Could not add persistent objects:', error);
            // Continue without persistent objects for now
        }
    }

    public play(): void {
        Logger.getInstance().log('Simulation play');
        // Add play logic here
    }

    public pause(): void {
        Logger.getInstance().log('Simulation pause');
        // Add pause logic here
    }

    public reset(): void {
        Logger.getInstance().log('Simulation reset');
        // Add reset logic here
    }

    public setRenderSystem(renderSystem: SimplifiedRenderSystem): void {
        this.renderSystem = renderSystem;
    }
}
