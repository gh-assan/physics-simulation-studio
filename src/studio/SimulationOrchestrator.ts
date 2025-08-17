import { IPluginManager } from '../core/plugin/IPluginManager';
import { IWorld } from "../core/ecs/IWorld";
import { World } from '../core/ecs/World';
import { Logger } from "../core/utils/Logger";
import { IStudio } from './IStudio';
import { ISimulationOrchestrator } from './ISimulationOrchestrator';
import { SimulationManager } from './simulation/SimulationManager';
import { ISimulationManager } from '../core/simulation/interfaces';
import * as THREE from 'three';

export class SimulationOrchestrator implements ISimulationOrchestrator {
    private world: IWorld;
    private pluginManager: IPluginManager;
    private renderSystem: any | null = null;
    private studio: IStudio;
    private simulationManager: ISimulationManager;

    constructor(world: IWorld, pluginManager: IPluginManager, studio: IStudio, simulationManager?: ISimulationManager) {
        this.world = world;
        this.pluginManager = pluginManager;
        this.studio = studio;
        // Use injected instance for tests, otherwise singleton
        this.simulationManager = simulationManager ?? SimulationManager.getInstance();
        Logger.getInstance().log("✅ SimulationOrchestrator: Simulation manager initialized");
    }

    public async loadSimulation(pluginName: string): Promise<void> {
        // Clear everything first for clean slate
        this._deactivateCurrentSimulation(pluginName);
        this._clearWorldAndRenderSystem();

        try {
            // Activate plugin
            await this.pluginManager.activatePlugin(pluginName, this.studio);
            Logger.getInstance().log(`✅ Loaded simulation plugin: ${pluginName}`);

            const activePlugin = this.pluginManager.getPlugin(pluginName);

            // Initialize entities FIRST - plugins create their own meshes
            if (activePlugin?.initializeEntities) {
                // Always pass the singleton SimulationManager instance if two arguments are expected
                const { SimulationManager } = require('./simulation/SimulationManager');
                const singletonManager = SimulationManager.getInstance();
                if (activePlugin.initializeEntities.length >= 2) {
                    await (activePlugin as any).initializeEntities(this.world, singletonManager);
                } else {
                    await activePlugin.initializeEntities(this.world);
                }
                Logger.getInstance().log(`🏗️ ${pluginName}: Entities and meshes initialized`);
            }

            // Register rendering system AFTER entities are created
            if (this.renderSystem && activePlugin) {
                // First, check if plugin has a registerRenderer method (new style)
                if (typeof (activePlugin as any).registerRenderer === 'function') {
                    await (activePlugin as any).registerRenderer(this.world);
                    Logger.getInstance().log(`🎨 ${pluginName}: Registered renderer via registerRenderer method`);
                }
                // Fallback to legacy getRenderer method
                else if (activePlugin.getRenderer) {
                    const pluginRenderer = activePlugin.getRenderer();
                    if (pluginRenderer && typeof pluginRenderer === 'object') {
                        // Check if it's a renderer-like object (adapter supports both)
                        if (pluginRenderer.name && (pluginRenderer.canRender || pluginRenderer.update) && (pluginRenderer.render || pluginRenderer.update)) {
                            this.renderSystem.registerRenderer(pluginRenderer as any);
                            Logger.getInstance().log(`🎨 ${pluginName}: Registered renderer: ${pluginRenderer.name}`);
                        }
                    }
                }
            }

            // Set entities in simulation manager for physics tracking
            const entityIds = Array.from(this.world.entityManager.getAllEntities());
            this.simulationManager.setEntities(entityIds);
            Logger.getInstance().log(`🔢 ${pluginName}: Registered ${entityIds.length} entities with physics manager`);

            // Initial update to establish rendering state
            this.world.update(0);
            this.world.systemManager.updateAll(this.world, 0);
            if (this.renderSystem) {
                this.renderSystem.update(this.world as World, 0);
            }

            // Dispatch loaded event
            const event = new CustomEvent("simulation-loaded", {
                detail: { simulationName: pluginName }
            });
            window.dispatchEvent(event);
            Logger.getInstance().log(`📡 Dispatched simulation-loaded event for ${pluginName}`);

        } catch (error: unknown) {
            Logger.getInstance().error(`❌ Failed to load simulation:`, error);
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
        Logger.getInstance().debug('Clearing everything for new simulation (clean slate approach)');

        // Clear the world entities but preserve systems - new simulation will populate fresh entities
    this.world.clear(false); // Preserve registered systems

        // Clear the scene completely - higher level abstraction approach
        if (this.renderSystem && typeof (this.renderSystem as any).getScene === 'function') {
            const renderSystem = this.renderSystem as any;
            const scene = renderSystem.getScene();

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
        this.simulationManager.play();
        Logger.getInstance().log('▶️ SimulationOrchestrator: Starting simulation physics');
    }

    public pause(): void {
        this.simulationManager.pause();
        Logger.getInstance().log('⏸️ SimulationOrchestrator: Pausing simulation physics');
    }

    public reset(): void {
        this.simulationManager.reset();
        Logger.getInstance().log('🔄 SimulationOrchestrator: Resetting simulation physics');
    }

    public stepSimulation(deltaTime: number): void {
        // Step the physics simulation
        this.simulationManager.step(deltaTime);
    }

    public setRenderSystem(renderSystem: any): void {
        this.renderSystem = renderSystem;
        if (this.simulationManager && typeof (this.simulationManager as any).setRenderSystem === 'function') {
            (this.simulationManager as any).setRenderSystem(renderSystem);
        }
        if (this.simulationManager && typeof (this.simulationManager as any).setRenderSystem === 'function') {
            (this.simulationManager as any).setRenderSystem(renderSystem);
        }
    }

        public getSimulationDebugInfo(): any {
            if (typeof (this.simulationManager as any)?.getDebugInfo === 'function') {
                return (this.simulationManager as any).getDebugInfo();
            }
            return {};
        }
}
