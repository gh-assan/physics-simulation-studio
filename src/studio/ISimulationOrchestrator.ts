export interface ISimulationOrchestrator {
    loadSimulation(pluginName: string): Promise<void>;
    unloadSimulation(activePluginName: string): void;
    play(): void;
    pause(): void;
    reset(): void;
    setRenderSystem(renderSystem: any): void;
}
