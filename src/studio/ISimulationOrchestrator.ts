export interface ISimulationOrchestrator {
    loadSimulation(pluginName: string): Promise<void>;
    unloadSimulation(activePluginName: string | null): void;
    play(): void;
    pause(): void;
    reset(): void;
    setRenderSystem(renderSystem: any): void;
}
